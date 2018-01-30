/*
 * This file is part of the INTO-CPS toolchain.
 *
 * Copyright (c) 2017-CurrentYear, INTO-CPS Association,
 * c/o Professor Peter Gorm Larsen, Department of Engineering
 * Finlandsgade 22, 8200 Aarhus N.
 *
 * All rights reserved.
 *
 * THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
 * THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
 * ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
 * RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL 
 * VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
 *
 * The INTO-CPS toolchain  and the INTO-CPS Association Public License 
 * are obtained from the INTO-CPS Association, either from the above address,
 * from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
 * GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of  MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
 * BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
 * THE INTO-CPS ASSOCIATION.
 *
 * See the full INTO-CPS Association Public License conditions for more details.
 *
 * See the CONTRIBUTORS file for author and contributor information. 
 */

import { IntoCpsApp } from "./../IntoCpsApp";
var sha1 = require('node-sha1');
var fs = require('fs');
var execSync = require('child_process').execSync;
let appInstance:IntoCpsApp = null;
export class GitCommands{

    private static removeNewline(str: string) : string{
        return str.substr(0,str.length-1);
    }

    public static getUserData(){
        var username: string = this.removeNewline(this.execGitCmd("git config user.name").toString());
        var email: string = this.removeNewline(this.execGitCmd("git config user.email").toString());
        return new UserData(username, email);
    } 

    public static getHashOfFile(pathOrContent: string, isContent?:boolean) : string{
        var fileContent:Buffer;
        if (!isContent){
            fileContent = fs.readFileSync(pathOrContent);
        }else{
            fileContent = new Buffer(pathOrContent);
        }
        return sha1(Buffer.concat([new Buffer("blob " + fileContent.length + "\0"), fileContent]));        
    }

    public static commitFile(path: string){
        this.execGitCmd(`git add -f "${path}"`);
        this.execGitCmd(`git commit -m "autocommit" "${path}"`);
    }

     public static addFile(path: string){
        this.execGitCmd(`git add -f "${path}"`);
    }

    public static execGitCmd(gitCmd: string)
    {
        if (!appInstance){
            appInstance = IntoCpsApp.getInstance();
        }
        return execSync(gitCmd,{cwd:appInstance.getActiveProject().getRootFilePath()});
    }
}



export class UserData{
    public username: string;
    public email: string;
    public constructor(username:string, email: string){
        this.username = username;
        this.email = email;
    }
}
