##
## This file is part of the INTO-CPS toolchain.
##
## Copyright (c) 2017-CurrentYear, INTO-CPS Association,
## c/o Professor Peter Gorm Larsen, Department of Engineering
## Finlandsgade 22, 8200 Aarhus N.
##
## All rights reserved.
##
## THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
## THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
## ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
## RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL 
## VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
##
## The INTO-CPS toolchain  and the INTO-CPS Association Public License 
## are obtained from the INTO-CPS Association, either from the above address,
## from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
## GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
##
## This program is distributed WITHOUT ANY WARRANTY; without
## even the implied warranty of  MERCHANTABILITY or FITNESS FOR
## A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
## BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
## THE INTO-CPS ASSOCIATION.
##
## See the full INTO-CPS Association Public License conditions for more details.
##
## See the CONTRIBUTORS file for author and contributor information. 
##




#!/usr/bin/env python
## -------------------------------------------------------------------------
## This script validates JSON messages (to be posted to OSLC server)
## according to given Schemata
## 
## See:
##   http://wiki.eng.au.dk/display/INTOCPS/Task+4.4+-+Traceability+and+model+management
##   http://wiki.eng.au.dk/display/INTOCPS/JSON+Message+Naming+Convention+and+Schema
## 
## -------------------------------------------------------------------------
## @TABLE OF CONTENTS:                 [TOCD: 10:41 30 Jun 2017]
##
##      [0.1] GLOBALS
##  [1] AUX FUNCTIONS
##  [2] MAIN
##      [2.1] PROCESS THE SUCCESSFULLY READ INPUT FILES
##	[1] AUX FUNCTIONS
##	[2] API FUNCTIONS
## ----------------------------------------------------------------------


import os
import glob
import sys
import json

from jsonschema import validate
from collections import namedtuple
from optparse import OptionParser



## ###############################################
## [0.1] GLOBALS
## ###############################################

# dictionary version(string) -> json Schema 
global SCHEMAS
SCHEMAS = {}

global INPUTS
INPUTS = []

## validated entries

DATA = namedtuple("DATA", "filename json_data used_version validates")

global VALIDATION_OBJECTS
VALIDATION_OBJECTS = []

## ###################################################################
## [1] AUX FUNCTIONS
## ###################################################################

def abort(errmsg="<unspecified abort>"):
    sys.stderr.write("ERROR: " + errmsg + "\n")
    exit(1)

def validate_all():
    global VALIDATION_OBJECTS
    print "## ---- PERFORM VALIDATION --------------------------------"
    for obj in VALIDATION_OBJECTS:
        try:
            validate(obj.json_data, SCHEMAS[obj.used_version])
            obj.validates.append(used_version)
            print "{0} [against V{1}]: PASS".format(obj.filename, obj.used_version)
        except Exception as e:
            print "{0} [against V{1}]: FAIL".format(obj.filename, obj.used_version)
            print """--> ERROR OUTPUT:
{0}
--------------------------------------------------
""".format(e)

def print_summary(used_schema):
    if used_schema is not None:
        version_info = used_schema
    else:
        version_info = "(the one given in the input file)"
    n_ok = 0
    for obj in VALIDATION_OBJECTS:
        if obj.validates:
            n_ok = n_ok + 1
    print """
== SUMMARY ===================================================================
USED_SCHEMA    :  {3}
NUMER OF INPUTS: {0:3}   [100.0 %]
VALIDATED      : {1:3}   [{2:3.1f} %]
==============================================================================
""".format(len(VALIDATION_OBJECTS), n_ok, (100.0 * float(n_ok) / float(len(VALIDATION_OBJECTS))), version_info)

## ###################################################################
## [2] MAIN
## ###################################################################

global usage
usage = """val_oslc.py  [JSON-File]*

Check whether a given JSON-File validates according to the available Schemata
stored in sub-directory ./Schemas/

Schema References:
  http://wiki.eng.au.dk/display/INTOCPS/JSON+Message+Naming+Convention+and+Schema

Information about examples and schema changes:
  http://wiki.eng.au.dk/display/INTOCPS/Task+4.4+-+Traceability+and+model+management

"""
__version__ = "$Revision: 11097 $".replace("$", "")
global __ident__
__ident__   = "val_oscl.py ( " + __version__ + ")"


parser = OptionParser(usage=usage, version=__version__)
parser.add_option("-d", "--dir", metavar="DIR", dest="dir", default=None, 
                   help="Read *.json inputs (also) from directory")
parser.add_option("-u", "--use-version", metavar="messageFormatVersion", dest="use_version", default=None, 
                   help="Validate all inputs against the given messageFormatVersion (and ignore the messageFormatVersion stored in the inputs).")

(options, args) = parser.parse_args()

if options.dir:
    current_dir = os.getcwd()
    if os.path.isdir(options.dir):
        print "## ADDING ALL *.json FILES FROM DIRECTORY {0} AS INPUTS".format(options.dir)
        os.chdir(options.dir)
        for file in glob.glob("*.json"):
            INPUTS.append(os.path.join(options.dir, file))
        for file in glob.glob("*.dmsg"):
            INPUTS.append(os.path.join(options.dir, file))
    else:
            sys.stderr.write("WARNING: the directory {0} does not exists, ignoring this input.\n".format(options.dir))
    os.chdir(current_dir)

for arg in args:
    if os.path.exists(arg):
        INPUTS.append(arg)
    else:
	sys.stderr.write("ERROR: {0}: input file {1} does not exist\n".format(__ident__, arg))
	sys.stderr.write("\nusage:\n")
	sys.stderr.write(usage)
	sys.exit(0)


# read known schemas
for file in glob.glob("../src/resources/into-cps/tracability/schemas/*.json"):
    # take identifier from file name, all after 'V' and ignore the suffix
    version = ((file.replace(".json", "")).split('V'))[-1]
    print "## Importing {0}  [{1}]".format(file, version)
    with open(file, "r") as json_data:
        schema = json.load(json_data)
    desc = schema["description"]
    #id = (desc.split(" "))[-1]
    #print "   --> identifies as '{0}'".format(id)
    SCHEMAS[version] = schema

for file in INPUTS:
    with open(file) as json_data:
        try:
            print "## READING INPUT: {0}".format(file)
            data = json.load(json_data)
            if options.use_version:
                used_version = options.use_version
                # change json data of object such that 'messageFormatVersion' valus is 'used_version'
                # BUT for X.Y.Z only store X.Y
                version_parts = (options.use_version).split(".")
                (data["rdf:RDF"])["messageFormatVersion"] = "{0}.{1}".format(version_parts[0], version_parts[1])

            else:
                used_version = (data["rdf:RDF"])["messageFormatVersion"]

            if SCHEMAS[used_version]:
                VALIDATION_OBJECTS.append(DATA(filename=file, json_data=data, used_version=used_version, validates=[]))
            else:
                sys.stderr.write("WARNING: Input {0} to be validated against UNKNOWN schema version '{1}', ignoring!".format(file, used_version))
        except Exception as e:
            sys.stderr.write("WARNING: the file {0} could not be loaded as json data, ignoring this input.\n".format(file))
            sys.stderr.write("PROBLEM: {0}\n".format(e))


## ###############################################
## [2.1] PROCESS THE SUCCESSFULLY READ INPUT FILES
## ###############################################

if not VALIDATION_OBJECTS:
    sys.stderr.write("ERROR: no inputs.\n")
    sys.exit(1)

validate_all()
print_summary(options.use_version)

## -------------------------------------------------------------------------



