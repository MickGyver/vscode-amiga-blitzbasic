/* AmiBlitz Automation Script */

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

IF ~SHOW('P', 'PED.1') THEN DO
	SAY 'AmiBlitz3 Rexx port could not be opened'
	EXIT 10
END

/* Address PED and show it */
address PED.1
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