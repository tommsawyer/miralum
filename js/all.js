(function () {
/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../bower_components/almond/almond", function(){});

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('controls',[], function() {
    var Controls;
    return Controls = (function() {
      function Controls(canvas) {
        this.canvas = canvas;
        this.onMouseMove = bind(this.onMouseMove, this);
        this.raycaster = new THREE.Raycaster;
        this.mouse = new THREE.Vector2;
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('mousedown', this.onMouseClick, false);
        this.activeMesh = {
          object: null,
          material: null
        };
        this.selected = null;
        this.material = new THREE.MeshLambertMaterial({
          color: 0x00ff00
        });
        this.blockInfo = document.getElementById('blockInfo');
        this.blockName = document.getElementById('blockName');
        this.blockWidth = document.getElementById('blockWidth');
        this.blockHeight = document.getElementById('blockHeight');
      }

      Controls.prototype.onMouseMove = function(event) {
        event.preventDefault();
        this.mouse.x = (event.clientX / this.canvas.width) * 2 - 1;
        return this.mouse.y = -(event.clientY / this.canvas.height) * 2 + 1.3;
      };

      Controls.prototype.setActiveMesh = function(mesh) {
        if (!(this.activeMesh.object === mesh && this.activeMesh.object !== null)) {
          if (this.activeMesh.object !== null) {
            this.activeMesh.object.material = this.activeMesh.material;
          }
          this.activeMesh.object = mesh;
          this.activeMesh.material = mesh.material;
          this.activeMesh.object.material = this.material;
          return this.fillBlockFields(true, this.activeMesh.object.type);
        }
      };

      Controls.prototype.findIntersect = function(scene, camera) {
        var intersects;
        this.raycaster.setFromCamera(this.mouse, camera);
        intersects = this.raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          if (intersects !== this.selected) {
            this.setActiveMesh(intersects.first().object);
            return this.selected = intersects.slice();
          }
        } else {
          if (this.activeMesh.object !== null) {
            this.activeMesh.object.material = this.activeMesh.material;
          }
          this.activeMesh.object = null;
          this.fillBlockFields(false);
          return this.selected = null;
        }
      };

      Controls.prototype.fillBlockFields = function(visible, name, width, height) {
        if (visible) {
          this.blockInfo.style.display = 'block';
          this.blockName.innerText = name;
          this.blockWidth.innerHtml = width;
          return this.blockHeight.innerHtml = height;
        } else {
          return this.blockInfo.style.display = 'none';
        }
      };

      return Controls;

    })();
  });

}).call(this);

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('engine',['controls'], function(Controls) {
    var Engine;
    return Engine = (function(superClass) {
      extend(Engine, superClass);

      function Engine() {
        this.nextCamera = bind(this.nextCamera, this);
        this.addToScene = bind(this.addToScene, this);
        this.event = new CustomEvent('render', {});
        this._initialize();
        this._initializeCameras();
        this._initializeSpotilights();
        this._addAxes(50);
        this.controls = new Controls(this.renderer.domElement);
        this.run();
      }

      Engine.prototype.addToScene = function(obj) {
        if (obj.addToScene instanceof Function) {
          obj.addEventListener('newObject', (function(_this) {
            return function(event) {
              return _this.addToScene(event.detail);
            };
          })(this));
          obj.addEventListener('removeObject', (function(_this) {
            return function(event) {
              return _this.removeFromScene(event.detail);
            };
          })(this));
          obj.addToScene((function(_this) {
            return function(object) {
              return _this.scene.add(object);
            };
          })(this));
          return;
        }
        return this.scene.add(obj);
      };

      Engine.prototype.removeFromScene = function(obj) {
        return this.scene.remove(obj);
      };

      Engine.prototype.nextCamera = function() {
        if (this.currentCamera < this.cameraPositions.length - 1) {
          this.currentCamera++;
        } else {
          this.currentCamera = 0;
        }
        this.camera.position.x = this.cameraPositions[this.currentCamera].x;
        this.camera.position.y = this.cameraPositions[this.currentCamera].y;
        this.camera.position.z = this.cameraPositions[this.currentCamera].z;
        return this.camera.lookAt(this.scene.position);
      };

      Engine.prototype.moveCamera = function(y) {
        return this.camera.position.y += y;
      };

      Engine.prototype.viewObject = function(object) {
        var sizes, viewAngle;
        viewAngle = this.camera.fov.toRadians();
        sizes = (new THREE.Box3().setFromObject(object)).size();
        this.camera.position.z = object.position.z;
        this.camera.position.y = object.position.y / 2;
        this.camera.position.x = object.position.x - sizes.x / 2 - 40 - (Math.cos(viewAngle) * sizes.y / 2) / Math.sin(viewAngle);
        console.log(this.camera.position.x);
        return this.camera.lookAt(object.position);
      };

      Engine.prototype.run = function() {
        var renderScene;
        renderScene = (function(_this) {
          return function() {
            _this.dispatchEvent(_this.event);
            _this.controls.findIntersect(_this.scene, _this.camera);
            requestAnimationFrame(renderScene);
            return _this.renderer.render(_this.scene, _this.camera);
          };
        })(this);
        return renderScene();
      };

      Engine.prototype._initialize = function() {
        this.scene = new THREE.Scene;
        this.renderer = new THREE.WebGLRenderer;
        this.renderer.setClearColor(0xEEEEEE);
        this.renderer.setSize(document.body.clientWidth, document.body.clientHeight);
        return document.body.appendChild(this.renderer.domElement);
      };

      Engine.prototype._initializeSpotilights = function() {
        var spotlight;
        spotlight = new THREE.AmbientLight(0xffffff);
        spotlight.position.set(-30, 30, -10);
        this.scene.add(spotlight);
        spotlight.position.set(32, 30, 0);
        return this.scene.add(spotlight);
      };

      Engine.prototype._initializeCameras = function() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.x = -30;
        this.camera.position.y = 40;
        this.camera.position.z = 30;
        this.camera.lookAt(this.scene.position);
        this.cameraDistance = {
          x: 50,
          y: 50,
          z: 50
        };
        this.cameraPositionValues = {
          'LeftFront': new THREE.Vector3(-this.cameraDistance.x, this.cameraDistance.y, this.cameraDistance.z),
          'Front': new THREE.Vector3(0, this.cameraDistance.y, this.cameraDistance.z),
          'RightFront': new THREE.Vector3(this.cameraDistance.x, this.cameraDistance.y, this.cameraDistance.z)
        };
        this.cameraPositions = [this.cameraPositionValues.LeftFront, this.cameraPositionValues.Front, this.cameraPositionValues.RightFront];
        return this.currentCamera = 0;
      };

      Engine.prototype._addAxes = function(size) {
        this.axes = new THREE.AxisHelper(size);
        return this.scene.add(this.axes);
      };

      return Engine;

    })(THREE.EventDispatcher);
  });

}).call(this);

(function() {
  define('materials',['engine'], function(Engine) {
    var glassTexture, woodTexture;
    glassTexture = THREE.ImageUtils.loadTexture('../img/glass.jpg', void 0, Engine.renderer);
    glassTexture.minFilter = THREE.LinearFilter;
    woodTexture = THREE.ImageUtils.loadTexture('../img/wood.jpg', void 0, Engine.renderer);
    woodTexture.minFilter = THREE.LinearFilter;
    return {
      'glass': new THREE.MeshLambertMaterial({
        map: glassTexture,
        opacity: 0.3,
        transparent: true
      }),
      'panel': new THREE.MeshLambertMaterial({
        map: glassTexture
      }),
      'wood': new THREE.MeshLambertMaterial({
        map: woodTexture
      }),
      'line': new THREE.LineBasicMaterial({
        color: 0x000000
      })
    };
  });

}).call(this);

(function() {
  define('dimension',['physicalObject', 'materials'], function(physicalObject, Materials) {
    var Dimension;
    return Dimension = (function() {
      function Dimension(mesh, correction) {
        var LeftCorner, bottomBackCorner, bottomFrontCorner, bottomLeftCorner, bottomRightCorner, sizes, topLeftCorner;
        this.mesh = new THREE.Object3D;
        sizes = (new THREE.Box3().setFromObject(mesh)).size();
        bottomLeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y - sizes.y / 2, mesh.position.z - sizes.z / 2);
        bottomRightCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2);
        topLeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y + sizes.y / 2, mesh.position.z - sizes.z / 2);
        LeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y + sizes.y / 2, mesh.position.z - sizes.z / 2);
        bottomBackCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2 + correction);
        bottomFrontCorner = new THREE.Vector3(mesh.position.x + sizes.x / 2, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2 + correction);
        this.mesh.add(this.createLine(bottomLeftCorner, bottomRightCorner));
        this.mesh.add(this.createLine(topLeftCorner, bottomLeftCorner));
        this.mesh.add(this.createLine(bottomBackCorner, bottomFrontCorner));
      }

      Dimension.prototype.createLine = function(from, to) {
        var geometry;
        geometry = new THREE.Geometry;
        geometry.vertices.push(new THREE.Vector3(from.x, from.y, from.z));
        geometry.vertices.push(new THREE.Vector3(to.x, to.y, to.z));
        return new THREE.Line(geometry, Materials.line);
      };

      Dimension.prototype.sceneSizeToReal = function(size) {
        return size;
      };

      return Dimension;

    })();
  });

}).call(this);

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('physicalObject',['materials', 'dimension'], function(Materials, Dimension) {
    var PhysicalObject;
    return PhysicalObject = (function(superClass) {
      extend(PhysicalObject, superClass);

      function PhysicalObject(place, size, material) {
        var showCaseMaterial;
        this.place = place;
        this.size = size;
        this.material = material;
        this.removeChildrenObject = bind(this.removeChildrenObject, this);
        this.addChildrenObject = bind(this.addChildrenObject, this);
        this.dimension = null;
        this.showCaseGeometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        showCaseMaterial = this.material;
        this.mesh = new THREE.Mesh(this.showCaseGeometry, showCaseMaterial);
        this.mesh.position.x = this.place.x;
        this.mesh.position.y = this.place.y;
        this.mesh.position.z = this.place.z;
      }

      PhysicalObject.prototype.addToScene = function(callback) {
        return callback(this.mesh)();
      };

      PhysicalObject.prototype.addChildrenObject = function(object) {
        var event;
        event = new CustomEvent('newObject', {
          detail: object
        });
        return this.dispatchEvent(event);
      };

      PhysicalObject.prototype.removeChildrenObject = function(object) {
        var event;
        event = new CustomEvent('removeObject', {
          detail: object
        });
        return this.dispatchEvent(event);
      };

      PhysicalObject.prototype.toggleDimensions = function() {
        if (!this.dimension) {
          this.dimension = new Dimension(this.mesh, 2);
          return this.addChildrenObject(this.dimension.mesh);
        } else {
          this.removeChildrenObject(this.dimension.mesh);
          return this.dimension = null;
        }
      };

      PhysicalObject.prototype.getMesh = function() {
        return this.mesh;
      };

      return PhysicalObject;

    })(THREE.EventDispatcher);
  });

}).call(this);

(function() {
  define('utils',[], function() {
    var Place;
    Array.prototype.last = function() {
      return this[this.length - 1];
    };
    Array.prototype.first = function() {
      return this[0];
    };
    Number.prototype.toDegress = function() {
      return this * 180 / Math.PI;
    };
    Number.prototype.toRadians = function() {
      return Math.PI * this / 180;
    };
    Place = (function() {
      function Place(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }

      return Place;

    })();
    return {
      place: Place,
      size: Place
    };
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('border',['physicalObject'], function(physicalObject) {
    var Border;
    return Border = (function(superClass) {
      extend(Border, superClass);

      function Border(place, size, material) {
        this.place = place;
        this.size = size;
        this.material = material;
        Border.__super__.constructor.call(this, this.place, this.size, this.material);
        this.door = false;
        this.angle = 0;
        this.width = this.size.z;
        this.elementaryAngle = 2;
        this.radius = this.width / (90 / this.elementaryAngle) * (Math.PI / 2);
      }

      Border.prototype.openDoor = function() {
        if (this.door) {
          this.mesh.rotation.y -= Math.PI / 180 * this.elementaryAngle;
          this.mesh.position.x -= this.radius / 2 * Math.cos(this.angle);
          this.mesh.position.z -= this.radius / 2 * Math.sin(this.angle);
          this.angle += Math.PI / 180 * this.elementaryAngle;
          if (Math.abs(this.mesh.rotation.y) > Math.PI / 2) {
            return this.door = false;
          }
        }
      };

      return Border;

    })(physicalObject);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('showcase',['utils', 'border', 'physicalObject', 'materials', 'dimension'], function(Utils, Border, physicalObject, Materials, Dimension) {
    var ShowCase;
    return ShowCase = (function(superClass) {
      extend(ShowCase, superClass);

      function ShowCase(place, size, borderMaterial, backBorderMaterial, bottomStorageHeigth, topStorageHeight, storageMaterial) {
        var borderName, i, ind2, j, k, len, len1, len2, ref, ref1, ref2, storageName;
        this.place = place;
        this.size = size;
        this.borderMaterial = borderMaterial;
        this.backBorderMaterial = backBorderMaterial;
        this.bottomStorageHeigth = bottomStorageHeigth;
        this.topStorageHeight = topStorageHeight;
        this.storageMaterial = storageMaterial;
        this.borderWidth = 0.5;
        this.shelfs = [];
        this.borders = {
          'leftBorder': new Border(new Utils.place(this.place.x - this.size.x / 2, this.place.y, this.place.z), new Utils.size(this.borderWidth, this.size.y, this.size.z), this.borderMaterial),
          'rightBorder': new Border(new Utils.place(this.place.x + this.size.x / 2, this.place.y, this.place.z), new Utils.size(this.borderWidth, this.size.y, this.size.z), this.backBorderMaterial),
          'backBorder': new Border(new Utils.place(this.place.x, this.place.y, this.place.z - this.size.z / 2), new Utils.size(this.size.x, this.size.y, this.borderWidth), this.borderMaterial),
          'frontBorder': new Border(new Utils.place(this.place.x, this.place.y, this.place.z + this.size.z / 2), new Utils.size(this.size.x, this.size.y, this.borderWidth), this.borderMaterial)
        };
        this.bottomStoragePlace = new Utils.place(this.place.x, this.place.y - this.size.y / 2 - this.bottomStorageHeigth / 2, this.place.z);
        this.topStoragePlace = new Utils.place(this.place.x, this.place.y + this.size.y / 2 + this.topStorageHeight / 2, this.place.z);
        this.storageStands = {
          'bottomStorage': {
            'leftBorder': new Border(new Utils.place(this.bottomStoragePlace.x - this.size.x / 2, this.bottomStoragePlace.y, this.bottomStoragePlace.z), new Utils.size(this.borderWidth, this.bottomStorageHeigth, this.size.z), this.storageMaterial),
            'rightBorder': new Border(new Utils.place(this.bottomStoragePlace.x + this.size.x / 2, this.bottomStoragePlace.y, this.bottomStoragePlace.z), new Utils.size(this.borderWidth, this.bottomStorageHeigth, this.size.z), this.storageMaterial),
            'backBorder': new Border(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y, this.bottomStoragePlace.z - this.size.z / 2), new Utils.size(this.size.x, this.bottomStorageHeigth, this.borderWidth), this.storageMaterial),
            'frontBorder': new Border(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y, this.bottomStoragePlace.z + this.size.z / 2), new Utils.size(this.size.x, this.bottomStorageHeigth, this.borderWidth), this.storageMaterial),
            'bottomBorder': new Border(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y - this.bottomStorageHeigth / 2, this.bottomStoragePlace.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), this.storageMaterial)
          },
          'topStorage': {
            'leftBorder': new Border(new Utils.place(this.topStoragePlace.x - this.size.x / 2, this.topStoragePlace.y, this.topStoragePlace.z), new Utils.size(this.borderWidth, this.topStorageHeight, this.size.z), this.storageMaterial),
            'rightBorder': new Border(new Utils.place(this.topStoragePlace.x + this.size.x / 2, this.topStoragePlace.y, this.topStoragePlace.z), new Utils.size(this.borderWidth, this.topStorageHeight, this.size.z), this.storageMaterial),
            'backBorder': new Border(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y, this.topStoragePlace.z - this.size.z / 2), new Utils.size(this.size.x, this.topStorageHeight, this.borderWidth), this.storageMaterial),
            'frontBorder': new Border(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y, this.topStoragePlace.z + this.size.z / 2), new Utils.size(this.size.x, this.topStorageHeight, this.borderWidth), this.storageMaterial),
            'topBorder': new Border(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y + this.topStorageHeight / 2 - this.borderWidth / 2, this.topStoragePlace.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), this.storageMaterial)
          }
        };
        this.mesh = new THREE.Object3D;
        ref = Object.keys(this.borders);
        for (i = 0, len = ref.length; i < len; i++) {
          borderName = ref[i];
          this.mesh.add(this.borders[borderName].mesh);
        }
        ref1 = Object.keys(this.storageStands);
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          storageName = ref1[j];
          ref2 = Object.keys(this.storageStands[storageName]);
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            ind2 = ref2[k];
            this.mesh.add(this.storageStands[storageName][ind2].mesh);
          }
        }
      }

      ShowCase.prototype.addToScene = function(callback) {
        return callback(this.mesh);
      };

      ShowCase.prototype.addShelf = function(height) {
        this.shelfs.push(new Border(new Utils.place(this.place.x, height - this.size.y / 2, this.place.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), Materials.wood));
        return this.addChildrenObject.call(this, this.shelfs[this.shelfs.length - 1].mesh);
      };

      return ShowCase;

    })(physicalObject);
  });

}).call(this);

(function() {
  require(['engine', 'physicalObject', 'utils', 'materials', 'showcase'], function(Engine, physicalObject, Utils, Materials, ShowCase) {
    var engine, i, obj;
    engine = new Engine;
    i = 20;
    obj = new ShowCase(new Utils.place(0, 0, 0), new Utils.place(10, 60, 20), Materials.glass, Materials.wood, 10, 3, Materials.panel);
    engine.addToScene(obj);
    obj.addShelf(15);
    obj.addShelf(30);
    obj.addShelf(45);
    obj.borders["leftBorder"].door = true;
    document.getElementById('changeCamera').onclick = function() {
      return engine.nextCamera();
    };
    document.getElementById('centerCamera').onclick = function() {
      return engine.viewObject(obj.mesh);
    };
    document.getElementById('cameraUp').onclick = function() {
      return engine.moveCamera(5);
    };
    document.getElementById('cameraDown').onclick = function() {
      return engine.moveCamera(-5);
    };
    document.getElementById('toggleDimensions').onclick = function() {
      return obj.toggleDimensions();
    };
    document.getElementById('addShelf').onclick = function() {
      var height;
      height = document.getElementById('shelfHeight').value;
      return obj.addShelf(height);
    };
    return document.getElementById('addShowCase').onclick = function() {
      obj = new ShowCase(new Utils.place(0, 0, i), new Utils.place(10, 60, 20), Materials.glass);
      engine.addToScene(obj);
      obj.addShelf(15);
      obj.addShelf(30);
      obj.addShelf(45);
      return i += 20;
    };
  });

}).call(this);

define("main", function(){});

require(["main"]);
}());