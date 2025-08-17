#!/bin/bash

# Activates (brings window to front) the specified application.
# $1 - name of the app to activate

xdotool search "$1" windowactivate
