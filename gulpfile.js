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

// file globs
var outputPath = "dist/",
  htmlSrcs = ["src/**/*.html"],
  jsSrcs = "src/**/*.js",
  tsSrcs = ["src/**/*.ts"],
  resourcesFolder = "src/resources",
  cssSrcs = [
    "src/styles.css",
    "src/resources/bootstrap/css/bootstrap.css",
    resourcesFolder + "/w2ui-1.5/w2ui.min.css"
  ],
  customResources = [resourcesFolder + "/into-cps/**/*"],
  configJsons = ["./package.json"];
// Gulp plugins
var gulp = require("gulp"),
  ts = require("gulp-typescript"),
  sourcemap = require("gulp-sourcemaps"),
  tsProject = ts.createProject("tsconfig.json"),
  del = require("del"),
  filter = require("gulp-filter"),
  debug = require("gulp-debug"),
  merge = require("merge-stream"),
  packager = require("electron-packager"),
  packageJSON = require("./package.json"),
  webpack = require("webpack"),
  htmlhint = require("gulp-htmlhint"),
  runSequence = require("run-sequence"),
  bump = require("gulp-bump"),
  gutil = require("gulp-util"),
  git = require("gulp-git"),
  fs = require("fs"),
  minimist = require("minimist"),
  semver = require("semver"),
  cleancss = require("gulp-clean-css"),
  uglify = require("gulp-uglify"),
  pipeline = require('readable-stream').pipeline,
  saveLicense = require("uglify-save-license"),
  zip = require('gulp-zip');
// Tasks

// Automated Release Prep

function getPackageJson() {
  // multiple calls so the version number won't be updated
  return JSON.parse(fs.readFileSync("./package.json", "utf8"));
}

var knownOptions = {
  string: "vt",
  boolean: "rel",
  boolean: "verbose",
  default: { vt: "patch", rel: false, verbose: false, }
};

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task("bump-rel", function () {
  var pkg = getPackageJson();
  var newVer = semver.inc(pkg.version, options.vt);

  if (!options.rel) {
    newVer += "-rc";
  }

  return gulp
    .src(configJsons)

    .pipe(bump({ version: newVer }))
    .pipe(gulp.dest("./"));
});

gulp.task("bump-dev", function () {
  var pkg = getPackageJson();
  var newVer = semver.inc(pkg.version, "prepatch", "dev");
  newVer = newVer.slice(0, -2);

  return gulp
    .src(configJsons)
    .pipe(bump({ version: newVer }))
    .pipe(gulp.dest("./"));
});

gulp.task("commit-changes", function () {
  return gulp
    .src(["./package.json"])
    .pipe(git.add())
    .pipe(git.commit("[GULP] Bump version number"));
});

gulp.task("push-changes", function (cb) {
  git.push("origin", "master", cb);
});

gulp.task("create-new-tag", function (cb) {
  var version = getPackageJson().version;
  var tag = "v" + version;
  git.tag(tag, "Created Tag for version: " + version, function (error) {
    if (error) {
      return cb(error);
    }
    git.push("origin", "master", { args: "--tags" }, cb);
  });
});

gulp.task("prep-release",
  gulp.series(
    "bump-rel",
    "commit-changes",
    "push-changes",
    "create-new-tag"
  )
);

gulp.task("prep-new-dev",
  gulp.series(
    "bump-dev",
    "commit-changes",
    "push-changes"
  )
);

// Clean everything!
gulp.task("clean", function () {
  return del([outputPath]);
});

// Compile and uglify. Only used for packaged app
gulp.task("compile-ts-uglify", function () {
  return pipeline(
    gulp.src(tsSrcs),
    tsProject(),
    uglify({
      output: { comments: saveLicense }
    }),
    gulp.dest(outputPath));
});

// Compile TS->JS with sourcemaps.
gulp.task("compile-ts", function () {
  var tsResult = gulp
    .src(tsSrcs)
    .pipe(sourcemap.init())
    .pipe(tsProject());

  return tsResult.js.pipe(sourcemap.write()).pipe(gulp.dest(outputPath));
});

// Compile Angular 2 application
gulp.task("compile-ng2", function (callback) {
  webpack(require("./webpack.config.js"), function (err, stats) {
    if(options.verbose) {
      if (err) { guitl.log(err); }
    if (stats) { gutil.log(stats); }
    }
    callback();
  });
});

// Copy bootstrap fonts to destination
gulp.task("copy-fonts", function () {
  return gulp
    .src("src/resources/bootstrap/fonts/**/*")
    .pipe(gulp.dest(outputPath + "fonts"));
});

// Copy custom resources
gulp.task("copy-custom", function () {
  return gulp
    .src(customResources)
    .pipe(gulp.dest(outputPath + "resources/into-cps"));
});

// Copy css to app folder
gulp.task("copy-css", function () {
  return gulp
    .src(cssSrcs)
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

//Build App for debugging
gulp.task(
  "build",
  gulp.series(
    "compile-ts",
    "compile-ng2",
    "copy-js",
    "copy-html",
    "copy-css",
    "copy-fonts",
    "copy-custom"
  )
);

//Prep App for packaging
gulp.task(
  "prep-pkg",
  gulp.series(
    "compile-ts-uglify",
    "compile-ng2",
    "copy-js",
    "copy-html",
    "copy-css",
    "copy-fonts",
    "copy-custom"
  )
);

//Build packages
gulp.task("pkg-darwin", function (done) {
  var options = {
    dir: ".",
    name: packageJSON.name + "-" + packageJSON.version,
    platform: "darwin",
    arch: "x64",
    overwrite: true,
    prune: true,
    icon: "src/resources/into-cps/appicon/into-cps-logo.png.icns",
    out: "pkg",
    "app-version": packageJSON.version,
    "version-string": {
      CompanyName: packageJSON.author.name,
      ProductName: packageJSON.productName
    }
  };

  return packager(options)
    .then(appPaths => {
      console.log(appPaths);
      return;
    })
    .catch((e) => console.error(e));
});

gulp.task('package-darwin', gulp.series('clean', 'prep-pkg', 'pkg-darwin'));


gulp.task("pkg-linux", function (callback) {
  var options = {
    dir: '.',
    name: packageJSON.name + '-' + packageJSON.version,
    platform: "linux",
    arch: "ia32,x64",
    overwrite: true,
    prune: true,
    out: 'pkg',
    "app-version": packageJSON.version,
    "version-string": {
      "CompanyName": packageJSON.author.name,
      "ProductName": packageJSON.productName
    }
  };

  return packager(options)
    .then(appPaths => {
      console.log(appPaths);
      return;
    })
    .catch((e) => console.error(e));
});

gulp.task('package-linux', gulp.series('clean', 'prep-pkg', 'pkg-linux'));


gulp.task("pkg-win32", function (callback) {
  var options = {
    dir: ".",
    name: packageJSON.name + "-" + packageJSON.version,
    platform: "win32",
    arch: "all",
    overwrite: true,
    prune: true,
    icon: "src/resources/into-cps/appicon/into-cps-logo.png.ico",
    out: "pkg",
    "app-version": packageJSON.version,
    "version-string": {
      CompanyName: packageJSON.author.name,
      ProductName: packageJSON.productName
    }
  };
  return packager(options).then(appPaths => {
    console.log(appPaths);
    return;
  })
    .catch((e) => console.error(e));
});

gulp.task("package-win32", gulp.series("clean", "prep-pkg", "pkg-win32"));

gulp.task("package-all",
  gulp.series(
    "package-win32",
    "package-linux",
    "package-darwin")
);

gulp.task("pkg", function (callback) {
  del('pkg');
  del('zipped');
  var options = {
    dir: ".",
    name: packageJSON.name + "-" + packageJSON.version,
    overwrite: true,
    prune: true,
    icon: "src/resources/into-cps/appicon/into-cps-logo.png.ico",
    out: "pkg",
    "app-version": packageJSON.version,
    "version-string": {
      CompanyName: packageJSON.author.name,
      ProductName: packageJSON.productName
    }
  };
  return packager(options).then(appPaths => {
    gulp.src(appPaths[0] + '/**')
      .pipe(zip(appPaths[0] + '.zip'))
      .pipe(gulp.dest('zipped'))
  })
    .catch((e) => console.error(e));
});


gulp.task("package", gulp.series("clean", "prep-pkg", "pkg"));



// Watch for changes and rebuild on the fly
gulp.task("watch", function () {
  gulp.watch(htmlSrcs, ["copy-html"]);
  gulp.watch(jsSrcs, ["copy-js"]);
  gulp.watch(tsSrcs, ["compile-ts"]);
  gulp.watch(cssSrcs, ["copy-css"]);
  gulp.watch(customResources, ["copy-custom"]);
});

// Default task
gulp.task("default", gulp.series("build"));
