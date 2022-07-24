/* Blitz Basic 2 Automation Script */

/* Set the path to the Blitz Basic 2 executable (if needed) */
bb2exe = 'Blitz2:Blitz2'

/* Get all command line parameters */
PARSE ARG commandline
count = 0
DO WHILE LENGTH( commandline ) > 0
   commandline = STRIP( commandline, 'B' )
   count = count + 1
   IF LEFT( commandline, 1 ) = '"' THEN DO
      PARSE VAR commandline '"'parameter.count'"' commandline
   END
   ELSE DO
      PARSE VAR commandline parameter.count commandline
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

/* Load and save all the include files to make them tokenized (command line parameters 2+) */
DO counter = 2 TO parameter.0
   LOAD parameter.counter
   SAVE
END

/* Load the main project file (first command line parameter) */
LOAD parameter.1

/* Compile the project */
COMPILE