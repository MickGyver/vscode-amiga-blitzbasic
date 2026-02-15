/* Blitz Basic 2 Automation Script */

/* Set the path to the Blitz Basic 2 executable (if needed) */
bb2exe = 'Blitz2:Blitz2'

/* Get all command line parameters */
PARSE ARG commandline
count = 0
xtraFlags = ''
DO WHILE LENGTH( commandline ) > 0
	commandline = STRIP( commandline, 'B' )
	IF LEFT(commandline, 3) = 'co=' THEN DO
		PARSE VAR commandline xtraFlags commandline
		xtraFlags = RIGHT(xtraFlags, 4)
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

/* Load and save all the include files to make them tokenized (command line parameters 2+) */
DO counter = 2 TO parameter.0
   LOAD parameter.counter
   SAVE
END

/* Set compiler options */
IF LENGTH(xtraFlags) > 0 & EXISTS(xtraFile) THEN DO
	ADDRESS COMMAND 'Run >NIL: BB2XtraEditor '||parameter.1||'.xtra '||xtraFlags
	ADDRESS COMMAND 'Wait >NIL: 1 SEC'
END

/* Load the main project file (first command line parameter) */
LOAD parameter.1