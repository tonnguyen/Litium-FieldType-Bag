const webpack = require('webpack');
const helpers = require('../helpers');
const distPath = helpers.root('dist');
const TerserPlugin = require('terser-webpack-plugin');
const HappyPack = require('happypack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
const moduleName = 'FieldTypeBag';
const commonVendorsTest = require('litium-ui/common-vendors-module.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => ({
    mode: argv.mode,
    context: __dirname,
    target: 'web',
    entry: {
        [moduleName]: [helpers.root('src/' + moduleName + '/extensions.ts')],
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                options: {
                    emitErrors: true,
                    failOnHint: false
                }
            },
            {
                test: /\.(ts(x?))$/,
                use: ['happypack/loader?id=ts'],
                exclude: /node_modules/
            },
            {
                test: /\.(js)$/,
                use: ['happypack/loader?id=js'],
                exclude: /node_modules/
            },
            {
                test: /\.(css)$/,
                use: ['to-string-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: ['to-string-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(html)$/,
                use: ['raw-loader']
            },
            {
                test: /\.(woff2?|ttf|eot|svg)$/,
                use: 'url?limit=10000'
            },
            // Ignore warnings about System.import in Angular
            { test: /[\/\\]@angular[\/\\].+\.js$/, parser: { system: true } }
        ]
    },
    optimization: {
        namedModules: true,
        namedChunks: true,
        minimize: argv.mode == 'production',
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                parallel: true,
                cache: true,
                terserOptions: {
                    compress: {
                        keep_fnames: true
                    },
                    mangle: {
                        keep_fnames: true,
                    }
                }
            })
        ],
        // set runtimeChunk to true to generate the runtime Accelerator file, to move webpackBootstrap
        // to runtime file, keeping Accelerator.js to clean, to not containing webpackBootstrap.
        // The dynamic component loading would not work if Accelerator.js contains webpackBootstrap
        runtimeChunk: {
            // name it as manifest then we will re-use the Litium Web's runtime
            name: 'manifest'
        },
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: commonVendorsTest,
                    name: "vendor",
                    chunks: "all"
                },
                'litium-ui': {
                    test: /[\\/]litium-ui[\\/]/,
                    name: "litium-ui",
                    chunks: "all"
                }
            }
        }
    },
    output: {
        path: distPath,
        publicPath: '/Litium/Client/Scripts/dist/'
    },
    plugins: [
        new HappyPack({
            id: 'ts',
            threads: 4,
            loaders: ['babel-loader', { path: 'ts-loader', query: { happyPackMode: true } }, 'angular2-template-loader', 'angular2-router-loader']
        }),
        new HappyPack({
            id: 'js',
            threads: 2,
            loaders: ['babel-loader']
        }),
        new ForkTsCheckerWebpackPlugin({ tsconfig: helpers.root('tsconfig.json') }),
        // new BundleAnalyzerPlugin(),
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)esm5/,
            path.resolve(__dirname, '../src')
        )
    ],
    resolve: {
        modules: [
            helpers.root("node_modules"),
            helpers.root("src/" + moduleName)
        ],
        extensions: ['.ts', '.js', '.json', '.tsx']
    }
});