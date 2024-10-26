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

"use strict";

import gulp from "gulp";
import fs from 'fs';
import path from 'path';
import ts from "gulp-typescript";
import sourcemap from "gulp-sourcemaps";
import htmlhint from "gulp-htmlhint";
import cleancss from "gulp-clean-css";
import {deleteAsync} from 'del';

// File globs
var outputPath = "dist/",
    htmlSrcs = ["src/**/*.html"],
    jsSrcs = "src/**/*.js",
    tsSrcs = ["src/**/*.ts"],
    resourcesFolder = "src/resources",
    cssSrcs = [
      "src/styles.css",
      "src/resources/bootstrap/css/bootstrap.css",
      resourcesFolder + "/w2ui-2.0/w2ui-2.0.css"
    ],
    customResources = [resourcesFolder + "/**/*", "!" + resourcesFolder + "/appicon/**/*.{png,ico}"];
    

// Gulp plugins
const tsProject = ts.createProject("tsconfig.json");

// Clean output directory
gulp.task("clean", async function () {
  return await deleteAsync([outputPath]);
});

// Copy custom resources
gulp.task("copy-custom", function () {
  return gulp
    .src(customResources)
    .pipe(gulp.dest(outputPath + "resources"));
});


gulp.task("copy-icons", function (done) {
  const sourceDir = path.join(resourcesFolder, 'into-cps/appicon');
  const destDir = path.join(outputPath, 'resources/into-cps/appicon');

  // Verifica che la cartella di destinazione esista o creala
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copia ogni file dalla cartella di origine a quella di destinazione
  fs.readdirSync(sourceDir).forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const destFile = path.join(destDir, file);

    fs.copyFileSync(sourceFile, destFile);
  });

  done();
});


// Copy css to app folder
gulp.task("copy-css", function () {
  return gulp
    .src(cssSrcs, { allowEmpty: true }) //allowEmpty to be removed when all css files are in place
    .pipe(cleancss())
    .pipe(gulp.dest(outputPath + "css"));
});

// Copy html to app folder
gulp.task("copy-html", function () {
  return gulp
    .src(htmlSrcs)
    .pipe(
      htmlhint({
        "attr-lowercase": [
          "formControlName",
          "formGroupName",
          "formArrayName",
          "*ngIf",
          "*ngFor",
          "[(ngModel)]",
          "[formGroup]",
          "[formControl]",
          "(ngSubmit)",
          "#configForm",
          "[basePath]",
          "(pathChange)",
          "[ngModel]",
          "(ngModelChange)",
          "[ngValue]",
          "[ngModelOptions]"
        ],
        "doctype-first": false
      })
    )
    .pipe(htmlhint.reporter())
    .pipe(gulp.dest(outputPath));
});

// Copy js to app folder
gulp.task("copy-js", function () {
  return (
    gulp
      .src(jsSrcs)
      // process js here if needed
      .pipe(gulp.dest(outputPath))
  );
});

// Compile TS->JS with sourcemaps.
gulp.task("compile-ts", function () {
  return gulp.src(tsSrcs)
    .pipe(sourcemap.init())
    .pipe(tsProject())
    .pipe(sourcemap.write())
    .pipe(gulp.dest(outputPath));
});

// Build task
gulp.task(
  "build",
  gulp.series(
    "compile-ts",
    "copy-js",
    "copy-html",
    "copy-css",
    "copy-custom",
    "copy-icons"
  )
);
// Watch for changes and rebuild
gulp.task("watch", function () {
  gulp.watch(tsSrcs, gulp.series("build"));
});

// Default task
gulp.task("default", gulp.series("build"));
