/* AmiBlitz Automation Script */

/* Set the path to the Amiblitz executable */
ab3exe = 'AmiBlitz:Amiblitz3'

/* Get all command line parameters */
PARSE ARG commandline
count = 0
optionTemp = ''
optionAll = 0
optionRun = 0
DO WHILE LENGTH( commandline ) > 0
  commandline = STRIP( commandline, 'B' )
	IF LEFT(commandline, 1) = '-' THEN DO
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
  SAY "No AB3 file supplied!"
  EXIT 10
END

/* Separate directory and filename of main file */
directory = ''
filename = ''
PARSE VAR parameter.1 directory '/' filename

/* Start Ped if it is not running */
IF ~SHOW('P', 'PED.1') THEN DO
	IF EXISTS(ab3exe) THEN DO
		ADDRESS COMMAND 'Run >NIL: '||ab3exe||' -PED'
		DO 30 WHILE ~SHOW('P','PED.1')
			 ADDRESS COMMAND 'Wait >NIL: 1 SEC'
		END
		ADDRESS COMMAND 'Wait >NIL: 1 SEC'
	END
	ELSE DO
		SAY "AmiBlitz 3 could not be loaded."
		EXIT 10
	END
END

IF ~SHOW('P', 'PED.1') THEN DO
	SAY 'AmiBlitz 3 Rexx port could not be opened'
	EXIT 10
END

/* Address PED and show it */
address PED.1
SHOWSCREEN
WINDOWTOFRONT
ACTIVATE

/* Load the main project file (first command line parameter) */
LOAD parameter.1

/* Compile the project */
IF optionRun > 0 THEN COMPILE