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
libRoot.push(path.resolve("src/client"));
libRoot.push(path.resolve("src/common"));
libRoot.push(path.resolve("src/common/message"));
// libRoot.push(path.resolve("src/common/message/impl"));
libRoot.push(path.resolve("src/common/messenger"));
// libRoot.push(path.resolve("src/common/messenger/messagingadapter"));
libRoot.push(path.resolve("src/common/topicparser"));
libRoot.push(path.resolve("src/common/util"));
libRoot.push(path.resolve("src/common/timeline"));
libRoot.push(path.resolve("src"));
libRoot.push(path.resolve("node_modules"));

// Paths to source files for test builds
testRoot.push(path.resolve("tests/specs"));
testRoot.push(path.resolve("tests/mocks"));
testRoot = testRoot.concat(libRoot);

module.exports = function(grunt) {

  grunt.initConfig({

    clean: {
      dist: "dist",
      build: "build",
      tests: "build/tests",
      tmp: "build/tmp"
    },
    webpack: {
      mode: "development",
      lib_browser: {
        entry: './src/client/CloudSyncKit.js',
        output: {
          path: path.resolve("dist/browser"),
          filename: "CloudSyncKit.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'CloudSyncKit',
          libraryTarget: 'commonjs2'
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env']
                }
              }
            }
          ]
        },
        resolve: {
          modules: libRoot
        }
      },

      lib_browser2: {
        mode: "development",
        entry: './src/client/CloudSynchroniser.js',
        output: {
          path: path.resolve("dist/browser"),
          filename: "CloudSynchroniser.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'CloudSynchroniser',
          libraryTarget: 'commonjs2'
        },
        externals: {
          "dvbcss-clocks": true,
          "dvbcss-protocols": true,
        },
        module: {
          rules: []
        },
        resolve: {
          modules: libRoot
        }
      },

      messageNode: {
        mode: "development",
        entry: './src/common/message/Message.js',
        output: {
          path: path.resolve("./build/lib"),
          filename: "MessageFactory.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'MessageFactory',
          libraryTarget: 'commonjs2'
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env']
                }
              }
            }
          ]
        },
        resolve: {
          modules: libRoot
        }
      },

      messengerNode: {
        entry: './src/common/messenger/Messenger.js',
        output: {
          path: path.resolve("./build/lib"),
          filename: "Messenger.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'Messenger',
          libraryTarget: 'commonjs2'
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env']
                }
              }
            }
          ]
        },
        resolve: {
          modules: libRoot
        }
      },

      specs: {
        entry: "./tests/main.js",
        output: {
          path: path.resolve("build/tests/"),
          filename: "specs.js",
          chunkFilename: "chunk-[name]-[chunkhash].js"
        },
        module: {
          rules: []
        },
        resolve: {
          modules: testRoot
        }
      }
    },

    jasmine: {
      tests: {
        src: [],  // not needed because each test uses require() to load what it is testing
        options: {
          specs: "build/tests/specs.js",
          outfile: "build/tests/_specRunner.html",
          summary: true,
          keepRunner: true
        }
      }
    },

    watch: {
      scripts: {
        files: [
          'src/common/**/*.js',
          'src/client/**/*.js',
          'src/service/**/*.js',
          'tests/**/*.test.js',
          'Gruntfile.js'
        ],
        // Do not call watch here (e.g. do not call 'default').
        // Otherwise there will be two (three, four, ...) watch tasks running
        // after first (second, third ...) invokation of watch!
        // Consequently all attached tasks will be executed two (three, four, ...) times.
        tasks: ['build_lib'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
      tests: {
        files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
        tasks: ['build_tests'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
    },

    jsdoc : {
        // dist : {
        //     src: ['README.md', 'src/**/*.js', 'test/**/*.js'],
        //     options: {
        //         destination: 'doc'
        //     }
        // },
        msg: {
            src: [
              "src/common/message/readme.md",
              "src/common/message/*.js",
              "src/common/messenger/**/*.js"
            ],
            options: {
                destination: 'doc/message'
            }
        },
        clientLibrary: {
            src: [
              "src/client/readme.md",
              "src/client/*.js",
              "src/common/state/SyncTLElection.js"
            ],
            options: {
                destination: 'doc/clientlib'
            }
        },
        timeline: {
            src: ["src/common/timeline/*.js"],
            options: {
                destination: 'doc/timeline'
            }
        }
    },

    md: {
        posts: {
            src: 'src/readme.md',
            dest: 'doc/index.html',
            flatten: true
        }
    },

    plantuml: {

        // Create sequence diagrams from *.seqdiag files
        seqdiags: {
            src: ['./src/documentation/**/*.seqdiag'],
            dest: './doc/sequence_diagrams'
        },

        compdiags: {
            src: ['./src/documentation/**/*.compdiag'],
            dest: './doc/component_diagrams'
        }
    },

    
  });


  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-md');
  grunt.loadNpmTasks('grunt-plantuml');

  // default do nothing
  grunt.registerTask('default', ['build_lib', 'watch:scripts']);
  grunt.registerTask('test', ['build_tests', 'watch:tests']);

  grunt.registerTask('build_tests', ['build_lib', 'clean:tests', 'webpack:specs', 'jasmine:tests']);
  grunt.registerTask('build_lib', ['clean:dist', 'clean:build', 'webpack:messageNode', "webpack:messengerNode", 'webpack:lib_browser', 'webpack:lib_browser2', "clean:tmp" ]);
  grunt.registerTask("doc", [ "jsdoc", "md", "plantuml" ]);

};
