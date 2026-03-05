/* Blitz Basic 2 Automation Script */

/* Set the path to the Blitz Basic 2 executable (if needed) */
bb2exe = 'Blitz2:Blitz2'

/* Get all command line parameters */
PARSE ARG commandline
count = 0
optionTemp = ''
optionAll = 0
optionRun = 0
xtraFlags = ''
DO WHILE LENGTH( commandline ) > 0
	commandline = STRIP( commandline, 'B' )
	IF LEFT(commandline, 3) = 'co=' THEN DO
		PARSE VAR commandline xtraFlags commandline
		xtraFlags = RIGHT(xtraFlags, 4)
	END
	ELSE IF LEFT(commandline, 1) = '-' THEN DO
    PARSE VAR commandline optionTemp commandline
    IF COMPARE(optionTemp, '-a') = 0 THEN optionAll = 1
    IF COMPARE(optionTemp, '-r') = 0 THEN optionRun = 1
  END
  ELSE DO
		count = count + 1
		IF LEFT( commandline, 1 ) = '"' THEN DO
			PARSE VAR commandline '"'parameter.count'"' commandline
		END
		ELSE DO
			PARSE VAR commandline parameter.count commandline
		END
	END
END
parameter.0 = count
DROP commandline

/* Check if we have a filename */
IF parameter.0 = 0 THEN DO
  SAY "No BB2 file supplied!"
  EXIT 10
END

/* Separate directory and filename of main file */
directory = ''
filename = ''
PARSE VAR parameter.1 directory '/' filename

/* Create a list off .bb2 files in RAM */
count = 0
files.0 = 0
IF optionAll > 0 THEN DO
  ADDRESS COMMAND 'Run >NIL: LIST '||directory||' FILES PAT "#?.bb2" LFORMAT="%s" >>ram:bb2files'
END

/* Start Ted if it is  not running */
IF ~SHOW('P', 'TED_REXX1') THEN DO
	IF EXISTS(bb2exe) THEN DO
		ADDRESS COMMAND 'Run >NIL: '||bb2exe
		DO 30 WHILE ~SHOW('P','TED_REXX1')
			 ADDRESS COMMAND 'Wait >NIL: 1 SEC'
		END
		ADDRESS COMMAND 'Wait >NIL: 1 SEC'
		ADDRESS COMMAND 'Run >NIL: BB2NagAway'
		ADDRESS COMMAND 'Wait >NIL: 1 SEC'
	END
	ELSE DO
		SAY "Blitz Basic 2 could not be loaded."
		EXIT 10
	END
END

IF ~SHOW('P', 'TED_REXX1') THEN DO
	SAY 'Blitz Basic 2 Rexx port could not be opened'
	EXIT 10
END

/* Open the list of .bb2 files */
temp = ''
IF optionAll > 0 THEN DO
  IF OPEN('bb2files','ram:bb2files','Read') > 0 THEN DO
    DO WHILE EOF('bb2files') = 0
      temp = STRIP( READLN('bb2files'), 'B' )
      IF COMPARE(temp, filename) > 0 THEN DO
        count = count + 1
        files.count = temp
      END
    END
    files.0 = count-1 /* The last one is an empty one so we will skip that */
    CLOSE('bb2files')
  END
END

/* Address Ted and show it */
address TED_REXX1
SHOWSCREEN
WINDOWTOFRONT
ACTIVATE

/* Load and save the main file to create the .xtra file for it if needed */
xtraFile = parameter.1||'.xtra'
IF ~EXISTS(xtraFile) THEN DO
	LOAD parameter.1
	SAVE
END

/* Load and save all the other files to make them tokenized */
IF optionAll > 0 THEN DO
  DO counter = 1 TO files.0
    incFile = directory||'/'||files.counter
    LOAD incFile
    SAVE
  END
END

/* Set compiler options */
IF LENGTH(xtraFlags) > 0 & EXISTS(xtraFile) THEN DO
	ADDRESS COMMAND 'Run >NIL: BB2XtraEditor '||parameter.1||'.xtra '||xtraFlags
	ADDRESS COMMAND 'Wait >NIL: 1 SEC'
END

/* Load the main project file (first command line parameter) */
LOAD parameter.1

/* Delete the list of BB2 files */
IF optionAll > 0 THEN DO
  ADDRESS COMMAND 'Run >NIL: DELETE ram:bb2files'
END

/* Compile the project */
IF optionRun > 0 THEN COMPILE
