/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/
var path = require("path"),
	libRoot = [],
	testRoot = [];

// Paths to source files for library builds
libRoot.push(path.resolve("../common"));
libRoot.push(path.resolve("../common/message"));
// libRoot.push(path.resolve("../common/message/impl"));
libRoot.push(path.resolve("../common/messenger"));
libRoot.push(path.resolve("../common/topicparser"));
libRoot.push(path.resolve("../common/util"));
libRoot.push(path.resolve("../common/timeline"));
libRoot.push(path.resolve("../common/datastore"));
libRoot.push(path.resolve("../common/state"));
libRoot.push(path.resolve("../synccontroller"));
libRoot.push(path.resolve("node_modules"));

module.exports = function(grunt) {

	grunt.initConfig({

		clean: {
			dist: "dist",
			build: "build",
			tmp: "build/tmp"
		},

		webpack: {
			messageFactoryNode: {
				mode: "development",
				entry: "../common/message/Message.js",
				output: {
					path: path.resolve("./build/lib"),
					filename: "MessageFactory.js",
					chunkFilename: "chunk-[name]-[chunkhash].js",
					library: "MessageFactory",
					libraryTarget: "commonjs2"
				},
				module: {
					rules: []
				},
				resolve: {
					modules: libRoot
				}
			},

			messengerNode: {
				mode: "development",
				entry: "../common/messenger/Messenger.js",
				output: {
					path: path.resolve("./build/lib"),
					filename: "Messenger.js",
					chunkFilename: "chunk-[name]-[chunkhash].js",
					library: "Messenger",
					libraryTarget: "commonjs2"
				},
				module: {
					rules: []
				},
				resolve: {
					modules: libRoot
				}
			},

			
		},

		watch: {
			scripts: {
				files: [
					"../common/**/*.js",
					"../common/datastore/**/*.js", 
					"../common/state/**/*.js", 
					"../synccontroller/**/*.js", 
					"Gruntfile.js"
				],
				// Do not call watch here (e.g. do not call 'default').
				// Otherwise there will be two (three, four, ...) watch tasks running
				// after first (second, third ...) invokation of watch!
				// Consequently all attached tasks will be executed two (three, four, ...) times.
				tasks: ["build_lib"],
				options: {
					interrupt: true,
					event: "all"
				}
			},
		}

	});


	grunt.loadNpmTasks("grunt-webpack");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");


	// default do nothing
	grunt.registerTask("default", ["build_lib", "watch:scripts"]);
	grunt.registerTask("build_lib", ["clean:build", "webpack:messageFactoryNode", "webpack:messengerNode", "clean:tmp" ]);


};
