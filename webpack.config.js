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

var path = require('path');
var webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');


module.exports = {
    devtool: 'source-map',
    entry: {
        '@angular': [
            'rxjs',
            'reflect-metadata',
            'zone.js'
        ],
        'common': ['es6-shim'],
        'src' : './src/main.js',
    },

    output: {
        path: __dirname + '/dist/',
        publicPath: 'dist/',
        filename: '[name].js',
        sourceMapFilename: '[name].js.map',
        chunkFilename: '[id].chunk.js'
    },

    resolve: {
        extensions: ['.ts','.js','.json', '.css', '.html']
    },
    optimization: {
        splitChunks: {
          cacheGroups: {
            commons: {
              name: 'commons',
              chunks: 'initial',
              minChunks: 2
            }
          }
        },
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {}
            })
        ]
      },

    module: {
      rules: [
          {
            test: /\.ts$/,
            loader: 'ts-loader',
            options: { transpileOnly: true},
            include: /src/
        },
        {
            test: /\.json$/,
            loader: 'json-loader',
            include: /src/
        },
        {
            test: /\.(css|html)$/,
            loader: 'raw-loader',
            include: /src/
        },
        {
            test: /\.(png|jpg)$/,
            loader: 'url-loader',
            options: { limit: 10000 },
            include: /src/
        }
        ]},
    plugins: [
        new webpack.LoaderOptionsPlugin({
                debug: true
       }),
       new webpack.SourceMapDevToolPlugin({
       })
    ],
    target:'electron-renderer'
};
