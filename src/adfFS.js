export default class Adf {

    constructor()
    {
		this.SectorSize = 512; // the size in bytes of one sector;
		this.SectorCount = 1760;
		this.rootSector = this.SectorCount/2;
		this.disk=null;
    }

	// @ts-ignore
	loadDisk (buffer,next) {
        this.disk = this.binaryStream(buffer,true);

        if (this.disk.length == 901120){
			// only standard DD disks are support that can store 880kb
			// those disks have 1760 sectors of 512 bytes each
			this.getInfo();
			if (next) next(true);
		}else{
			console.error("this does not seem to be an uncompressed ADF file");
			if (next) next(false,this.disk);
		}
	};

	// @ts-ignore
	setDisk(_disk){
		this.disk = _disk;
		return this.getInfo();
	};

	getInfo() {

		this.disk.goto(0);

		var info = {};
		info.diskFormat =this.disk.readString(3);
		var diskType = this.disk.readUbyte();
		info.diskType = (diskType%2) == 0 ? "OFS" : 'FFS';

		// read rootblock
		this.disk.goto(this.rootSector * this.SectorSize);
		info.inforootBlockType = this.disk.readLong();
		if (info.inforootBlockType !== 2){
			info.diskType = "UNKNOWN";
			info.diskFormat = "UNKNOWN";
		}

		this.disk.goto((this.rootSector * this.SectorSize) + this.SectorSize - 80);
		var nameLength = this.disk.readUbyte();
		info.label = this.disk.readString(nameLength);

		this.disk.info = info;
		
		if (!this.disk.bitmap){
			this.getFreeSize();
		}

		return info;
	};

	isFFS(){
		return this.disk.info.diskType === "FFS";
	};

	// @ts-ignore
	getSectorType (sector){
		if (sector == 0) return "BOOTBLOCK";
		if (sector == this.rootSector) return "ROOTBLOCK";
		if (sector == this.disk.bitmapBlock) return "BITMAP BLOCK";

		this.disk.goto(sector * this.SectorSize);
		var long = this.disk.readLong();
		if (long == 2) return "HEADER";
		if (long == 8) return "DATA BLOCK";
		if (long == 16) return "LIST (File extension block)";
		if (long == 33) return "DIRCACHE (Directory cache block)";

		return "EMPTY (or this is not a DOS disk)"
	};

	// @ts-ignore
	writeFile (name,buffer,folder){
		var folderHeaderBlock = this.readHeaderBlock(folder);
		var nameIndex = this.getNameHashIndex(name);
		var data = buffer;
		var i;

        console.log("Write file: " + name);
        // TODO: check if file already exists and delete it if needed

        // check if it will fit
		var freeBlocks = this.getFreeBlocks();

		var fileSize = data.length;
        var dataBlockSize = this.isFFS() ? this.SectorSize : this.SectorSize-24;
        var dataBlockCount = Math.ceil(fileSize/dataBlockSize);
        var headerBlockCount = Math.ceil(dataBlockCount/72);

		var totalBlocks = dataBlockCount + headerBlockCount;
        
        console.log("File will need " + totalBlocks + " blocks");

        if (totalBlocks>freeBlocks){
        	console.error("Not enough space on device");
			return false;
		}

        // create file, starting with the main header block
        var sector = this.getEmptyBlock();
        this.clearSector(sector);
		let dataBlockCountHeader=72
		//if less than 1 block
		if (headerBlockCount==1) {
			dataBlockCountHeader=dataBlockCount;
		}
        var header = this.createFileHeaderBlock(sector,name,dataBlockCountHeader,data.length,folder);
        this.disk.bitmap[sector] = 0; // mark as used
		
		var headerBlocks = [header];
		if (headerBlockCount>1){
			console.log("Creating " + (headerBlockCount-1) + " Extension blocks"); 
			let dataBlockCountExtension=dataBlockCount;
			for (i = 1; i<headerBlockCount;i++){
				var newSector = this.getEmptyBlock();
				this.clearSector(newSector);
				this.disk.bitmap[newSector] = 0;
				dataBlockCountExtension=dataBlockCountExtension-72;
				let dataBlockCountExt=72
				if (dataBlockCountExtension<72) {
					dataBlockCountExt=dataBlockCountExtension;
				}
				headerBlocks.push(this.createExtensionBlock(newSector,sector,dataBlockCountExt));
			}
			
			// chain them

			for (i = 0; i<headerBlockCount-1;i++){
				headerBlocks[i].dataBlockExtension = headerBlocks[i+1].sector;
			}
		}
		
        if (dataBlockCount){
			// create dataBlocks
			var dataBlocks = [];
			var headerIndex = 0;
			var pointerIndex = 72-1;//headerBlocks[0].DataBlockCount-1;

			for (i = 0; i<dataBlockCount; i++){
				
				// get empty block and mark as used
				var dataSector = this.getEmptyBlock();
				this.clearSector(dataSector);
				this.disk.bitmap[dataSector] = 0;

				var contentIndex = i*dataBlockSize;
				var contentSize = Math.min(fileSize-contentIndex,dataBlockSize);

				var dataBlock = {
					type: 8,
					number: i+1,
					headerSector: sector, // or is this the extension block?
					sector: dataSector,
					content: new Uint8Array(contentSize),
					dataSize: contentSize,
					nextDataBlock: 0
				};

				// fill content
				for (var j = 0;j<contentSize;j++){
					dataBlock.content[j] = data[contentIndex + j];
				}
				
				// put them in headerBlock
				headerBlocks[headerIndex].pointers[pointerIndex] = dataSector;
				pointerIndex--;
				if (pointerIndex<0){
					// jump to next header block
					headerIndex++;
					if (headerIndex<headerBlocks.length) {
						//pointerIndex = headerBlocks[headerIndex].DataBlockCount-1;
						pointerIndex = 72-1;
					}
				}
				
				dataBlocks.push(dataBlock);
			}

			// chain datablocks
			header.firstDataBlock = dataBlocks[0].sector;
			for (i = 0; i<dataBlockCount-1; i++){
				dataBlocks[i].nextDataBlock = dataBlocks[i+1].sector
			}

			// write datablocks to disk
			for (i = 0; i<dataBlockCount; i++){
				console.log("write data block " + dataBlocks[i].sector);
				this.writeDataBlock(dataBlocks[i].sector,dataBlocks[i]);
			}

			// write extension blocks to disk
			for (i = 1; i<headerBlockCount; i++){
                console.log("write extension block " + headerBlocks[i].sector);
				this.writeExtensionBlock(headerBlocks[i].sector,headerBlocks[i]);
			}
			
        }

		// put file in folder, link other files if needed
        var currentFile = folderHeaderBlock.pointers[nameIndex];
		if (currentFile){
			console.log("File with the same hash already present");
			// File with the same hash already present
			// link to new one
			header.linkedSector = currentFile;
		}

        console.log("Writing file header " + sector);
        this.writeHeaderBlock(sector,header);

        // add to folder
        folderHeaderBlock.pointers[nameIndex] = sector;
        this.writeHeaderBlock(folder,folderHeaderBlock);

        // update used blocks
        this.writeBitmapBlock(this.disk.bitmapBlock,this.disk.bitmap);

		return sector;
	};

    createFolder(name,folder){

    	// TODO: check if folder already exists
        var folderHeaderBlock = this.readHeaderBlock(folder);
        var nameIndex = this.getNameHashIndex(name);

        var sector = this.getEmptyBlock();
        this.clearSector(sector);
        var header = this.createFolderHeaderBlock(sector,name,folder);
        this.disk.bitmap[sector] = 0; // mark as used

		// write (empty) folder to disk
        header.linkedSector = folderHeaderBlock.pointers[nameIndex];
        this.writeHeaderBlock(sector,header);

        // add to folder
        folderHeaderBlock.pointers[nameIndex] = sector;
        this.writeHeaderBlock(folder,folderHeaderBlock);

        // update used blocks
        this.writeBitmapBlock(this.disk.bitmapBlock,this.disk.bitmap);
        
        return sector;
	};


	getFreeSize(){
		var rootBlock =  this.readHeaderBlock(this.rootSector);

        // let's assume wse only have one bitmapBlock ...
		this.disk.bitmapBlock = rootBlock.bitmapBlocks[0];
        var bitmapBlock = this.readBitmapBlock(rootBlock.bitmapBlocks[0]);

        var max = this.SectorCount;
        var count = 0;
        for (var i = 0;i<max;i++){
            count += bitmapBlock.map[i];
		}
        bitmapBlock.usedBlocks = count;
        this.disk.freeBlocks = max-count;
		this.disk.free = count*0.5;
		this.disk.used = 880 - this.disk.free;
		this.disk.bitmap = bitmapBlock.map;
		return this.disk;


	};

    readBitmapBlock(sector){
        var block = {};
        this.disk.goto(sector * this.SectorSize);
        block.checkSum = this.disk.readLong();

        block.longs = [];
        block.map = [1,1];
        for (var i = 1; i<= 55; i++){
            var b = this.disk.readLong();
            block.longs.push(b);

            for (var j = 0; j<32; j++){
                block.map.push((b>>>j) & 1);
			}
        }

        return block;
    }

    readHeaderBlock(sector){
		this.disk.goto(sector * this.SectorSize);

		var block = {};
		block.type  = this.disk.readLong(); // should be 2 for HEADER block
		block.headerSector  = this.disk.readLong(); // self pointer, should be the same as the initial sector
		block.DataBlockCount = this.disk.readLong(); // the amount of datablocks for files, unused for folders
		block.dataSize = this.disk.readLong(); // for folders this is the hash table size , 72 for DD this.disks
		block.firstDataBlock = this.disk.readLong(); // should be the same as the first block in the dataBlock List for files, not used for folders
		block.checkSum = this.disk.readLong();

		block.pointers = [];
		// 72 longs
		// for folders
		//      these are pointers of file and directory headers
		//      THE LOCATION IF THE HASHTABLE IS DETERMINED BY THE FILE/FOLDER NAME !!!
		// for files
		//      these are pointers to the datablocks
		//      the first datablock is last in the list
		for (var i = 0; i< 72; i++){
            block.pointers.push(this.disk.readLong() || 0);
		}

		if (sector === this.rootSector){
			// Root Block

			// maybe check the last long? - should be 1

            block.headerSector = 0;
            block.DataBlockCount = 0;
            block.firstDataBlock = 0;

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 200);
            block.bm_flag = this.disk.readLong();

            //bitmap blocks pointers
            block.bitmapBlocks = [];
            for (i = 0; i<25; i++){
                block.bitmapBlocks.push(this.disk.readLong());
			}

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 96);
            block.bitmap_ext = this.disk.readLong(); // first bitmap extension block - Hard this.disks >50 MB only

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 40);
            block.lastDiskChangeDays = this.disk.readLong(); // days since 1 jan 78
            block.lastDiskChangeMinutes = this.disk.readLong(); // minutes pas midnight
            block.lastDiskChangeTicks = this.disk.readLong(); // in 1/50s of a seconds, past lastt minute

            block.parent = 0;
            block.typeString = "ROOT";

		}else{
            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 188);
            block.size = this.disk.readLong(); // filesize for files, not used for folders
            var dataLength = this.disk.readUbyte();
            block.comment = dataLength ? this.disk.readString(dataLength) : "";


            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 16);
            block.linkedSector = this.disk.readLong(); // sector of entry in the same folder
            block.parent = this.disk.readLong();
            block.dataBlockExtension = this.disk.readLong();
            block.typeString = this.disk.readLong() == 4294967293 ? "FILE" : "DIR";
            // 4294967293 == -3 , should we read as signed ?
			// this value is 2 for folders and 1 for the root folder
		}


		this.disk.goto((sector * this.SectorSize) + this.SectorSize - 92);
		block.lastChangeDays = this.disk.readLong(); // days since 1 jan 78
		block.lastChangeMinutes = this.disk.readLong(); // minutes pas midnight
		block.lastChangeTicks = this.disk.readLong(); // in 1/50s of a seconds, past lastt minute

		dataLength = this.disk.readUbyte();
		block.name = dataLength ? this.disk.readString(dataLength) : ""; // max 30

		return block;
	}

	binaryStream(arrayBuffer, bigEndian){
		var obj = {
			index: 0,
			litteEndian : !bigEndian
		};
	
		obj.goto = function(value){
			setIndex(value);
		};
	
		obj.jump = function(value){
			this.goto(this.index + value);
		};
	
		obj.readByte = function(position){
			setIndex(position);
			var b = this.dataView.getInt8(this.index);
			this.index++;
			return b;
		};
	
		obj.writeByte = function(value,position){
			setIndex(position);
			this.dataView.setInt8(this.index,value);
			this.index++;
		};
	
		obj.readUbyte = function(position){
			setIndex(position);
			var b = this.dataView.getUint8(this.index);
			this.index++;
			return b;
		};
	
		obj.writeUbyte = function(value,position){
			setIndex(position);
			this.dataView.setUint8(this.index,value);
			this.index++;
		};
	
		obj.readUint = function(position){
			setIndex(position);
			var i = this.dataView.getUint32(this.index,this.litteEndian);
			this.index+=4;
			return i;
		};
	
		obj.writeUint = function(value,position){
			setIndex(position);
			this.dataView.setUint32(this.index,value,this.litteEndian);
			this.index+=4;
		};
	
		obj.readBytes = function(len,position,buffer) {
			setIndex(position);
	
	
			var i = this.index;
			var src = this.dataView;
			if ((len += i) > this.length) len = this.length;
			var offset = 0;
	
			for (; i < len; ++i) buffer.setUint8(offset++, this.dataView.getUint8(i));
			this.index += len;
			return buffer;
		};
	
		obj.readString = function(len,position){
			setIndex(position);
			var i = this.index;
			var src = this.dataView;
			var text = "";
	
			if ((len += i) > this.length) len = this.length;
	
			for (; i < len; ++i){
				var c = src.getUint8(i);
				if (c == 0) break;
				text += String.fromCharCode(c);
			}
	
			this.index = len;
			return text;
		};
	
		obj.writeString = function(value,position){
			setIndex(position);
			var src = this.dataView;
			var len = value.length;
			for (var i = 0; i < len; i++) src.setUint8(this.index + i,value.charCodeAt(i));
			this.index += len;
		};
	
		obj.writeStringSection = function(value,max,paddValue,position){
			setIndex(position);
			max = max || 1;
			value = value || "";
			paddValue = paddValue || 0;
			var len = value.length;
			if (len>max) value = value.substr(0,max);
			obj.writeString(value);
			obj.fill(paddValue,max-len);
		};
	
		// same as readUshort
		obj.readWord = function(position){
			setIndex(position);
			var w = this.dataView.getUint16(this.index, this.litteEndian);
			this.index += 2;
			return w;
		};
	
		obj.writeWord = function(value,position){
			setIndex(position);
			this.dataView.setUint16(this.index,value,this.litteEndian);
			this.index += 2;
		};
	
		obj.readLong = obj.readDWord = obj.readUint;
	
		obj.readShort = function(value,position){
			setIndex(position);
			var w = this.dataView.getInt16(this.index, this.litteEndian);
			this.index += 2;
			return w;
		};
	
		obj.readBits = function(count,bitPosition,position){
	
			// this reads $count bits, starting from byte $position and bit position $bitPosition
			// bitPosition can be > 8 , count should be <= 8;
	
			position = position === 0 ? position : position || obj.index;
			var bytePosition = position + (bitPosition >> 3);
			setIndex(bytePosition);
	
			bitPosition = bitPosition - ((bitPosition >> 3) << 3);
	
			var bits = byte2Bits(this.dataView.getUint8(this.index));
	
			if ((bitPosition + count)>8) bits = bits.concat(byte2Bits(this.dataView.getUint8(this.index+1)));
	
			return bits2Int(bits.slice(bitPosition,bitPosition+count));
		};
	
		obj.clear = function(length){
			obj.fill(0,length);
		};
	
		obj.fill = function(value,length){
			value = value || 0;
			length = length || 0;
			for (var i = 0; i<length; i++){
				obj.writeByte(value);
			}
		};
	
		obj.isEOF = function(margin){
			margin = margin || 0;
			return this.index >= (this.length-margin);
		};
	
		function setIndex(value){
			value = value === 0 ? value : value || obj.index;
			if (value<0) value = 0;
			if (value >= obj.length) value = obj.length-1;
	
			obj.index = value;
		}
	
		obj.buffer = arrayBuffer;
		obj.dataView = new DataView(arrayBuffer);
		obj.length = arrayBuffer.byteLength;
	
		return obj;
	
		// todo
		/*
	
		check if copying typed arraybuffers is faster then reading dataview
	
		 var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
		   var srcU8 = new Uint8Array(src, srcOffset, byteLength);
		   dstU8.set(srcU8);
	
		 */
	
		function byte2Bits(b){
			return [
				b>>7 & 1,
				b>>6 & 1,
				b>>5 & 1,
				b>>4 & 1,
				b>>3 & 1,
				b>>2 & 1,
				b>>1 & 1,
				b    & 1
			]
		}
	

		// @ts-ignore
		function bits2Int(bits){
			var v = 0;
			var len = bits.length-1;
			for (var i = 0; i<=len ; i++){
				v += bits[i] << (len-i);
			}
			return v;
		}
	}

	// @ts-ignore
	getNameHashIndex(name) {
        name = name.toUpperCase();
        var hash = name.length;
        for (var i = 0, max = name.length; i < max; i++) {
            hash=hash*13;
            hash=hash + name.charCodeAt(i);
            hash=hash&0x7ff;
        }
        hash = hash % ((this.SectorSize >> 2) - 56);
        // hash should be between 0 and 71 now ...
        return hash;
    }

	getFreeBlocks(){
        var max = this.disk.bitmap.length;
        var count = 0;
        for (var i = 0;i<max;i++){
            count += this.disk.bitmap[i];
        }
        return count;
	}

	getEmptyBlock(){
        for (var i=(this.rootSector+1);i<this.SectorCount;i++){
            if (this.disk.bitmap[i]) return i;
        }
        for (i=2;i<this.rootSector;i++){
            if (this.disk.bitmap[i]) return i;
        }
        console.error("no empty block found ...")
	}

	// @ts-ignore
	clearSector(sector){
		this.disk.goto(sector * this.SectorSize);
		for (var i = 0; i<this.SectorSize; i++){
			this.disk.writeUbyte(0);
		}
	};


	// @ts-ignore
	createFileHeaderBlock(sector,name,dataBlockCount,size,folder){

    	var dataBlockSize = this.isFFS() ? this.SectorSize : this.SectorSize-24;

    	var header = {
            type: 2,
            typeString: "FILE",
			sector: sector,
            pointers: [],
            size: size,
            linkedSector: 0,
            parent:folder,
            dataBlockExtension:0,
            DataBlockCount: dataBlockCount,
            dataSize:0,
            firstDataBlock:0,
            name: name
        };
        for (var i=0;i<72;i++){header.pointers[i] = 0}

    	return header;
	}

	// @ts-ignore
	createExtensionBlock(sector,parent,dataBlockCountExtension){
		var header = {
			type: 16,
			typeString: "EXTENSION",
			sector: sector,
			pointers: [],
            dataBlockExtension: 0,
			parent:parent,
			DataBlockCount: dataBlockCountExtension 
		};
		for (var i=0;i<dataBlockCountExtension;i++){header.pointers[i] = 0}

		return header;
	}

	// @ts-ignore
	writeDataBlock(sector,block){
        this.disk.goto(sector * this.SectorSize);

        if (this.isFFS()){
            for (var i = 0; i<block.dataSize; i++){
            	this.disk.writeUbyte(block.content[i]);
            }
        }else{
            this.disk.writeUint(block.type);
            this.disk.writeUint(block.headerSector);
            this.disk.writeUint(block.number);
            this.disk.writeUint(block.dataSize);
            this.disk.writeUint(block.nextDataBlock);
            this.disk.writeUint(0); // checksum
            for (i = 0; i<block.dataSize; i++){
                this.disk.writeUbyte(block.content[i] || 0);
            }

            // update checksum
            block.checkSum = this.calculateChecksum(sector);
            this.disk.goto(sector * this.SectorSize + 20);
            this.disk.writeUint(block.checkSum);
        }

        return block;
    }

	// @ts-ignore
	calculateChecksum(sector,checksumPos){
        var cs = 0;
        var po = 0;
		if (typeof sector === "number"){
            var sectorData =this.readSector(sector);
		}else{
            sectorData = sector;
		}

		var ignore = (typeof checksumPos === "number") ? checksumPos : -1;

        for (var i = 0; i < this.SectorSize; i += 4) {
        	if (i === ignore){
        		// ignore previous checksum;
			}else{
                cs += ((sectorData[po + i] << 24) | (sectorData[po + i + 1] << 16) | (sectorData[po + i + 2] << 8) | sectorData[po + i + 3]) >>> 0;
			}
            if (cs > 0xffffffff) cs -= 0x100000000;
        }
        cs = -cs;
        if (cs < 0) cs += 0x100000000;

        // todo: the location of the checksum is 0 for bitmapblocks, not 20 ...
        //if (typeof sector !== "number"){
        //    sector[20] = cs >>> 24;
        //    sector[21] = (cs >>> 16) & 0xff;
        //    sector[22] = (cs >>> 8) & 0xff;
        //    sector[23] = cs & 0xff;
        //    return sector;
        //}

        return cs;
	};


	// @ts-ignore
	writeExtensionBlock(sector,block){
		this.disk.goto(sector * this.SectorSize);
		this.disk.writeUint(16); //LIST block
		this.disk.writeUint(sector); 
		this.disk.writeUint(block.DataBlockCount); 
		this.disk.writeUint(0); 
		this.disk.writeUint(0); 
		this.disk.writeUint(0); // checksum
		
		for (var i = 0; i< block.pointers.length; i++){
			this.disk.writeUint(block.pointers[i] || 0);
		}
		this.disk.goto((sector * this.SectorSize) + this.SectorSize - 12);
		this.disk.writeUint(block.parent);
		this.disk.writeUint(block.dataBlockExtension);
		this.disk.writeUint(4294967293); //YCH : wtf? ??? blockTypeId = 4294967293; // -3



		// update checksum
		block.checkSum = this.calculateChecksum(sector);
		this.disk.goto(sector * this.SectorSize + 20);
		this.disk.writeUint(block.checkSum);

		return block;
	}

	// @ts-ignore
	writeHeaderBlock(sector,block){
        this.disk.goto(sector * this.SectorSize);

        this.disk.writeUint(2); // ID for header block 
        this.disk.writeUint(block.typeString === "ROOT" ? 0 : sector); // self pointer, should be the same as the initial sector, unused for root block
        this.disk.writeUint(block.DataBlockCount || 0); // the amount of datablocks for files, unused for folders
        this.disk.writeUint(block.dataSize || 0);
        this.disk.writeUint(block.firstDataBlock || 0); // should be the same as the first block in the dataBlock List for files, not used for folders
        this.disk.writeUint(0); // Checksum, this will be calculated later

        for (var i = 0; i< 72; i++){
            this.disk.writeUint(block.pointers[i] || 0);
        }

        var blockTypeId = 2; // folder

        if (block.typeString === "ROOT"){
            blockTypeId = 1;

			this.disk.goto((sector * this.SectorSize) + this.SectorSize - 200);
            this.disk.writeUint(block.bm_flag);
            for (i = 0; i<25; i++){
                this.disk.writeUint(block.bitmapBlocks[i] || 0);
            }

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 96);
            this.disk.writeUint(block.bitmap_ext);

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 40);
            this.disk.writeUint(block.lastDiskChangeDays); // days since 1 jan 78
            this.disk.writeUint(block.lastDiskChangeMinutes);
            this.disk.writeUint(block.lastDiskChangeTicks);

        }else{

            if (block.typeString === "FILE"){
                blockTypeId = 4294967293; // -3
            }

            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 188);
            this.disk.writeUint(block.size || 0); // filesize for files, not used for folders

            if (block.comment){
                this.disk.writeUbyte(block.comment.length);
                this.disk.writeString(block.comment); // max 79 chars
            }else{
                this.disk.writeUbyte(0);
			}


            this.disk.goto((sector * this.SectorSize) + this.SectorSize - 16);
            this.disk.writeUint(block.linkedSector);
            this.disk.writeUint(block.parent);
            this.disk.writeUint(block.dataBlockExtension);
		}

        this.disk.goto((sector * this.SectorSize) + this.SectorSize - 92);
        this.disk.writeUint(block.lastChangeDays); // days since 1 jan 78
        this.disk.writeUint(block.lastChangeMinutes);
        this.disk.writeUint(block.lastChangeTicks);

        if (block.name){
            this.disk.writeUbyte(block.name.length);
            this.disk.writeString(block.name); // TODO max length of name?
		}else{
            this.disk.writeUbyte(0);
		}

        this.disk.goto((sector * this.SectorSize) + this.SectorSize - 4);
        this.disk.writeUint(blockTypeId);

		// update checksum
        block.checkSum = this.calculateChecksum(sector);
        this.disk.goto(sector * this.SectorSize + 20);
        this.disk.writeUint(block.checkSum);

        return block;
    }

		    
	// @ts-ignore
	writeBitmapBlock(sector,bitmapData){
		this.disk.goto(sector * this.SectorSize);
        this.disk.writeUint(0); // checksum will be calculated later

		var index = 2; // ignore first 2 , these are the bootblock bits
		for (var i = 1; i<= 54; i++){
			var value = 0;
			for (var j = 0; j<31; j++){
				value += (bitmapData[index]<<j);
				index++;
			}
			// last one: javascript bitwise shift <<31 returns a negative number.
			if (bitmapData[index]) value += (1<<31>>>0);
			index++;
			this.disk.writeUint(value);
		}

		// last long used only the first 30 bits
        value = 0;
        for (j = 0; j<30; j++){
            value += (bitmapData[index]<<j);
            index++;
        }
        this.disk.writeUint(value);
		
		// update checksum
        var checksum = this.calculateChecksum(sector);
        this.disk.goto(sector * this.SectorSize);
        this.disk.writeUint(checksum);
	}

	// @ts-ignore
	createFolderHeaderBlock(sector,name,folder){
        var header = {
            type: 2,
            typeString: "DIR",
            sector: sector,
            pointers: [],
            linkedSector: 0,
            parent:folder,
            dataBlockExtension:0, // FFS Directory cache block
            name: name
        };
        for (var i=0;i<72;i++){header.pointers[i] = 0}

        return header;
    }

	readSector (sector,count){
		count = count || 1;
		this.disk.goto(sector * this.SectorSize);
		var size = this.SectorSize * count;
		var result = new Uint8Array(size);
		for (var i = 0; i<size; i++){
			result[i] = this.disk.readUbyte();
		}
		return result;
	}


	readRootFolder() {
		return this.readFolderAtSector(this.rootSector);
	}


	readFolderAtSector(sector){
		console.error("readFolderAtSector " + sector);

		var directory = this.readHeaderBlock(sector);
        directory.folders = [];
        directory.files = [];
        directory.sector = sector;

		// NOTE: block.pointers DO NOT hold the list of all files
		// the index in de pointerslist is determined by the name of the item
		// multiple files/folders with the same name are linked to each other
		var entries = [];
        directory.pointers.forEach(function(sector){
			if (sector){
                entries.push({
                    sector: sector,
                    name: this.getFileNameAtSector(sector),
                    typeString: this.getFileTypeAtSector(sector)
                })
			}
		},this);

		// NOTE:  entries.length may change in the loop if we find chained files
		for (var i = 0; i< entries.length; i++){
			var entry = entries[i];

			if (entry.typeString == "FILE"){ // TODO: can files only be linked to blocks?
				var file = this.readFileAtSector(entry.sector,false);
				directory.files.push(file);
				if (file.linkedSector) entries.push(
						{
							sector: file.linkedSector,
							name: this.getFileNameAtSector(file.linkedSector),
							typeString: this.getFileTypeAtSector(file.linkedSector)
						}
				);
			}else{
				directory.folders.push(entry);
                var folderHeader = this.readHeaderBlock(entry.sector);
                if (folderHeader.linkedSector) entries.push(
                    {
                        sector: folderHeader.linkedSector,
                        name: this.getFileNameAtSector(folderHeader.linkedSector),
                        typeString: this.getFileTypeAtSector(folderHeader.linkedSector)
                    }
                );
			}
		}

		return directory;
	}

	getFileNameAtSector(sector){
		this.disk.goto((sector * this.SectorSize) + this.SectorSize - 80);
		var nameLength = this.disk.readUbyte();
		return this.disk.readString(nameLength);

	}

	getFileTypeAtSector(sector){
		this.disk.goto((sector * this.SectorSize) + this.SectorSize - 4);
		var long = this.disk.readLong();
		return long == 4294967293 ? "FILE" : "DIR";
	}

	getDisk (){
		return this.disk;
	}

	readFileAtSector (sector,includeContent){
		var file = this.readHeaderBlock(sector);
        file.sector = sector;

		if (includeContent){
			file.content = new Uint8Array(file.size);
			var index = 0;

			// there are 2 ways to read a file in OFS:
			// 1 is to read the list of datablock pointers and collect each datablock
			// 2 is to follow the linked list of datablocks

			// the second one seems somewhat easier to implement
			// because otherwise we have to collect each extension block first
            var block = file;
			if (this.isFFS()){
				var sectors = block.pointers.slice().reverse();

				while (block.dataBlockExtension && sectors.length<2000){
					block = this.readExtensionBlock(block.dataBlockExtension);
					sectors = sectors.concat(block.pointers);
				}
				var maxSize = file.size;

				sectors.forEach(function(fileSector){
					if (fileSector){
                        block = this.readDataBlock(fileSector,maxSize);
                        file.content.set(block.content,index);
                        index += block.dataSize;
                        maxSize -= block.dataSize;
					}
				});
			}else{

				var nextBlock = block.firstDataBlock;
				while (nextBlock !== 0){
					block = this.readDataBlock(nextBlock);
					file.content.set(block.content,index);
					index += block.dataSize;
					nextBlock = block.nextDataBlock;
				}
			}

		}

		return file;
	}

	readDataBlock(sector,size){
		var block = {};
		this.disk.goto(sector * this.SectorSize);
	
		if (this.isFFS()){
			block.dataSize = Math.min(size,this.SectorSize);
			block.content = new Uint8Array(block.dataSize);
			for (var i = 0; i<block.dataSize; i++){
				block.content[i] = this.disk.readUbyte();
			}
		}else{
			block.type = this.disk.readLong(); // should be 8 for DATA block
			block.headerSector  = this.disk.readLong(); // points to the file HEADER block this data block belongs to;
			block.number = this.disk.readLong(); // index in the file datablock list;
			block.dataSize = this.disk.readLong();
			block.nextDataBlock = this.disk.readLong(); // == 0 if this is the last block
			block.checkSum = this.disk.readLong();
	
			if (block.type == 8){
				block.content = new Uint8Array(block.dataSize);
				this.disk.goto((sector * this.SectorSize) + 24);
				for (i = 0; i<block.dataSize; i++){
					block.content[i] = this.disk.readUbyte();
				}
			}else{
				// invalid file
				block.content = new Uint8Array(0);
				block.dataSize = 0;
				block.nextDataBlock = 0;
			}
			
		}
	
		return block;
	}

	readExtensionBlock(sector){
		var block = {};
		this.disk.goto(sector * this.SectorSize);
		block.type = this.disk.readLong(); // should be 16 for LIST block

		block.headerSector  = this.disk.readLong();
		block.DataBlockCount = this.disk.readLong();

        this.disk.goto(sector * this.SectorSize + 20);
		block.checkSum = this.disk.readLong();

		this.disk.goto(sector * this.SectorSize + 24);
		block.pointers = [];
		for (var i = 0; i< 72; i++){
            block.pointers.push(this.disk.readLong() || 0);
		}
		this.disk.goto((sector * this.SectorSize) + this.SectorSize - 8);
		block.dataBlockExtension = this.disk.readLong();


		console.log("Extension block " + sector,block.DataBlockCount);
		return block;
	}
}

