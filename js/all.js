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
    Number.prototype.square = function() {
      return this * this;
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
      getObjectSize: function(object) {
        return (new THREE.Box3().setFromObject(object)).size();
      },
      getDistance: function(firstPoint, secondPoint) {
        return Math.sqrt((firstPoint.x - secondPoint.x).square() + (firstPoint.y - secondPoint.y).square() + (firstPoint.z - secondPoint.z).square());
      },
      place: Place,
      size: Place
    };
  });

}).call(this);

(function() {
  define('interface',[], function() {
    var Interface;
    Interface = (function() {
      function Interface() {
        this.blockInfo = document.getElementById('blockInfo');
        this.blockName = document.getElementById('blockName');
        this.blockWidth = document.getElementById('blockWidth');
        this.blockHeight = document.getElementById('blockHeight');
        document.getElementById('openDoor').onclick = (function(_this) {
          return function() {
            return _this.activeShowCase.borders['frontBorder'].open();
          };
        })(this);
        document.getElementById('closeDoor').onclick = (function(_this) {
          return function() {
            return _this.activeShowCase.borders['frontBorder'].close();
          };
        })(this);
        document.getElementById('typeDoor').onchange = (function(_this) {
          return function() {
            return _this.activeShowCase.changeDoor("border", document.getElementById('typeDoor').value, +document.getElementById('countDoor').value);
          };
        })(this);
        document.getElementById('countDoor').onchange = (function(_this) {
          return function() {
            return _this.activeShowCase.changeDoor("border", document.getElementById('typeDoor').value, +document.getElementById('countDoor').value);
          };
        })(this);
      }

      Interface.prototype.openDoor = function() {
        return this.activeShowCase.borders['frontBorder'].open();
      };

      Interface.prototype.openDoor = function() {
        return this.activeShowCase.borders['frontBorder'].close();
      };

      Interface.prototype.clickOnShowCase = function(showcase) {
        this.activeShowCase = showcase;
        this.openDoor();
        return this.fillBlockFields(true, 'Витрина', showcase.size.z, showcase.size.y);
      };

      Interface.prototype.fillBlockFields = function(visible, name, width, height) {
        if (visible) {
          this.blockInfo.style.display = 'block';
          this.blockName.innerText = name;
          this.blockWidth.innerText = width;
          return this.blockHeight.innerText = height;
        } else {
          return this.blockInfo.style.display = 'none';
        }
      };


      /*
      			Пример конфига кнопки:
      				{
      					label: 'Добавить полку',
      					onclick: functionName
      				}
       */

      Interface.prototype.createButtonsMarkup = function(buttons) {
        var btn, button, i, len, results, td, tr;
        results = [];
        for (i = 0, len = buttons.length; i < len; i++) {
          button = buttons[i];
          btn = document.createElement('button');
          btn.onclick = button['onclick'];
          btn.innerText = button['label'];
          td = document.createElement('td');
          td.colSpan = 2;
          td.appendChild(btn);
          tr = document.createElement('tr');
          tr.appendChild(td);
          results.push(tr);
        }
        return results;
      };

      return Interface;

    })();
    return new Interface;
  });

}).call(this);

(function() {
  define('materials',[], function() {
    var glassTexture, panelTexture, woodTexture;
    glassTexture = THREE.ImageUtils.loadTexture('../img/blueGlass.jpg', void 0);
    glassTexture.minFilter = THREE.LinearFilter;
    woodTexture = THREE.ImageUtils.loadTexture('../img/wood.jpg', void 0);
    woodTexture.minFilter = THREE.LinearFilter;
    panelTexture = THREE.ImageUtils.loadTexture('../img/pan.jpg', void 0);
    panelTexture.minFilter = THREE.LinearFilter;
    return {
      'glass': new THREE.MeshLambertMaterial({
        map: glassTexture,
        opacity: 0.3,
        transparent: true
      }),
      'panel': new THREE.MeshLambertMaterial({
        map: panelTexture
      }),
      'wood': new THREE.MeshLambertMaterial({
        map: woodTexture
      }),
      'line': new THREE.LineBasicMaterial({
        color: 0x000000
      }),
      'winding': new THREE.MeshLambertMaterial({
        color: 0xffffff
      })
    };
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('dimension',['physicalObject', 'materials'], function(physicalObject, Materials) {
    var Dimension;
    return Dimension = (function(superClass) {
      extend(Dimension, superClass);

      function Dimension(mesh, correction) {
        var LeftCorner, bottomBackCorner, bottomFrontCorner, bottomLeftCorner, bottomRightCorner, sizes, topLeftCorner;
        Dimension.__super__.constructor.call(this);
        sizes = (new THREE.Box3().setFromObject(mesh)).size();
        bottomLeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y - sizes.y / 2, mesh.position.z - sizes.z / 2);
        bottomRightCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2);
        topLeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y + sizes.y / 2, mesh.position.z - sizes.z / 2);
        LeftCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2 - correction, mesh.position.y + sizes.y / 2, mesh.position.z - sizes.z / 2);
        bottomBackCorner = new THREE.Vector3(mesh.position.x - sizes.x / 2, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2 + correction);
        bottomFrontCorner = new THREE.Vector3(mesh.position.x + sizes.x / 2, mesh.position.y - sizes.y / 2, mesh.position.z + sizes.z / 2 + correction);
        this.add(this.createLine(bottomLeftCorner, bottomRightCorner));
        this.add(this.createLine(topLeftCorner, bottomLeftCorner));
        this.add(this.createLine(bottomBackCorner, bottomFrontCorner));
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

    })(THREE.Object3D);
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
        this.place = place;
        this.size = size;
        this.material = material;
        this.bOrder = bind(this.bOrder, this);
        this.removeChildrenObject = bind(this.removeChildrenObject, this);
        this.addChildrenObject = bind(this.addChildrenObject, this);
        PhysicalObject.__super__.constructor.apply(this, arguments);
        this.dimension = null;
        this.position.x = this.place.x;
        this.position.y = this.place.y;
        this.position.z = this.place.z;
      }

      PhysicalObject.prototype.addToScene = function(callback) {
        return callback(this);
      };

      PhysicalObject.prototype.addChildrenObject = function(object) {
        var event;
        event = new CustomEvent('newObject', {
          detail: object
        });
        return this.dispatchEvent(event);
      };

      PhysicalObject.prototype.removeChildrenObject = function(object) {
        return object.parent.remove(object);
      };

      PhysicalObject.prototype.toggleDimensions = function() {
        if (!this.dimension) {
          this.dimension = new Dimension(this, 2);
          return this.addChildrenObject(this.dimension);
        } else {
          this.removeChildrenObject(this.dimension);
          return this.dimension = null;
        }
      };

      PhysicalObject.prototype.click = function(params) {
        var event;
        event = new CustomEvent('click', {
          detail: params
        });
        return this.dispatchEvent(event);
      };

      PhysicalObject.prototype.getMesh = function() {
        return this;
      };

      PhysicalObject.prototype.bOrder = function(obj) {
        var child, i, len, ref, results;
        if (obj.children.length > 0) {
          ref = obj.children;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            results.push(this.bOrder(child));
          }
          return results;
        } else {
          return obj.renderOrder = -1;
        }
      };

      return PhysicalObject;

    })(THREE.Object3D);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('border',['physicalObject', 'engine'], function(physicalObject, Engine) {
    var Border;
    return Border = (function(superClass) {
      extend(Border, superClass);

      function Border(place, size, material, planeName) {
        this.place = place;
        this.size = size;
        this.material = material;
        this.planeName = planeName;
        Border.__super__.constructor.call(this, this.place, this.size, this.material);
        this.showCaseGeometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        this.add(new THREE.Mesh(this.showCaseGeometry, this.material));
      }

      Border.prototype.getParts = function() {
        return {
          size: this.size,
          material: this.material
        };
      };

      return Border;

    })(physicalObject);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('door',['physicalObject', 'border', 'utils'], function(physicalObject, Border, Utils) {
    var Door;
    return Door = (function(superClass) {
      extend(Door, superClass);

      function Door(place, size, material, planeName, openingDirection, openingType, isDouble) {
        var leftFlap, rightFlap, rightFlapOpeningDirection, rightFlapPlace, rightFlapSize;
        this.place = place;
        this.size = size;
        this.material = material;
        this.planeName = planeName;
        this.openingDirection = openingDirection;
        this.openingType = openingType;
        this.isDouble = isDouble != null ? isDouble : false;
        this.doorState = {
          "opened": "opened",
          "opening": "opening",
          "closing": "closing",
          "closed": "closed"
        };
        if (this.isDouble) {
          this.obj = new THREE.Object3D;
          rightFlapPlace = new Utils.place(this.place.x + this.size.x / 4, this.place.y, this.place.z);
          rightFlapSize = new Utils.size(this.size.x / 2, this.size.y, this.size.z);
          rightFlapOpeningDirection = "Right";
          rightFlap = new Door(rightFlapPlace, rightFlapSize, this.material, this.planeName, rightFlapOpeningDirection, this.openingType);
          this.place.x -= this.size.x / 4;
          this.size.x /= 2;
          this.openingDirection = "Left";
          leftFlap = new Door(this.place, this.size, this.material, this.planeName, "Left", this.openingType);
          this.obj.add(rightFlap);
          this.obj.add(leftFlap);
          this.obj.place = this.place;
          this.obj.size = this.size;
          this.obj.moving = this.moving;
          this.obj.open = this.open;
          this.obj.close = this.close;
          this.obj.doorState = this.doorState;
          this.obj.isDouble = this.isDouble;
          return this.obj;
        } else {
          Door.__super__.constructor.call(this, this.place, this.size, this.material, this.planeName);
          this.angle = 0;
          this.currentState = this.doorState.closed;
          this.width = this.size.x;
          this.elementaryAngle = 2;
          this.radius = this.width / (90 / this.elementaryAngle) * (Math.PI / 2);
          this.renderOrder = 10;
        }
      }

      Door.prototype.open = function() {
        var i, item, len, ref;
        if (this.isDouble) {
          ref = this.children;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.currentState === item.doorState.closed) {
              item.currentState = item.doorState.opening;
            }
          }
        }
        if (this.currentState === this.doorState.closed) {
          return this.currentState = this.doorState.opening;
        }
      };

      Door.prototype.close = function() {
        var i, item, len, ref;
        if (this.isDouble) {
          ref = this.children;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.currentState === item.doorState.opened) {
              item.currentState = item.doorState.closing;
            }
          }
        }
        if (this.currentState === this.doorState.opened) {
          return this.currentState = this.doorState.closing;
        }
      };

      Door.prototype.moving = function() {
        var deltaX, deltaZ, funcX, funcZ, i, item, ky, len, ref;
        if (this.isDouble) {
          ref = this.children;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            item.moving();
          }
        }
        if (this.currentState === this.doorState.opening || this.currentState === this.doorState.closing) {
          funcX = Math.sin(this.angle);
          funcZ = Math.cos(this.angle);
          deltaZ = 1;
          if (this.openingDirection === "Left") {
            ky = -1;
            deltaX = -1;
          } else {
            ky = 1;
            deltaX = 1;
          }
          if (this.currentState === this.doorState.closing && this.openingType === "swing") {
            ky *= -1;
            deltaZ *= -1;
            deltaX *= -1;
            funcX = Math.cos(this.angle);
            funcZ = Math.sin(this.angle);
          }
          if (this.openingType === "slide") {
            ky = 0;
            deltaZ = 0;
            deltaX *= this.currentState === this.doorState.opening ? 2 : -2;
          }
          this.rotation.y += (Math.PI / 180 * this.elementaryAngle) * ky;
          this.position.x += deltaX * (this.radius / 2 * funcX);
          this.position.z += deltaZ * (this.radius / 2 * funcZ);
          this.angle += Math.PI / 180 * this.elementaryAngle;
          if (this.currentState === this.doorState.opening) {
            if (Math.abs(this.angle) >= Math.PI / 2) {
              this.angle = 0;
              return this.currentState = this.doorState.opened;
            }
          } else {
            if (Math.abs(this.angle) >= Math.PI / 2) {
              this.angle = 0;
              return this.currentState = this.doorState.closed;
            }
          }
        }
      };

      Door.prototype.getParts = function() {
        return {
          size: this.size,
          material: this.material,
          isDouble: this.isDouble,
          type: this.openingType
        };
      };

      return Door;

    })(Border);
  });

}).call(this);

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('showcase',['utils', 'border', 'physicalObject', 'materials', 'dimension', 'door'], function(Utils, Border, physicalObject, Materials, Dimension, Door) {
    var ShowCase;
    return ShowCase = (function(superClass) {
      extend(ShowCase, superClass);

      function ShowCase(place, size1, borderMaterial, backBorderMaterial, bottomStorageHeigth, topStorageHeight, storageMaterial) {
        var borderName, i, ind2, j, k, l, len, len1, len2, len3, len4, len5, m, n, ref, ref1, ref2, ref3, ref4, ref5, storageName, winding, windingWidth;
        this.place = place;
        this.size = size1;
        this.borderMaterial = borderMaterial;
        this.backBorderMaterial = backBorderMaterial;
        this.bottomStorageHeigth = bottomStorageHeigth;
        this.topStorageHeight = topStorageHeight;
        this.storageMaterial = storageMaterial;
        this.changeBorderThickness = bind(this.changeBorderThickness, this);
        this.changeBorderMaterial = bind(this.changeBorderMaterial, this);
        this.changeSize = bind(this.changeSize, this);
        this.changeDoor = bind(this.changeDoor, this);
        ShowCase.__super__.constructor.apply(this, arguments);
        this.borderWidth = 0.5;
        this.shelfs = [];
        this.borders = {
          'leftBorder': new Border(new Utils.place(-this.size.x / 2 + this.borderWidth / 2, 0, 0), new Utils.size(this.borderWidth, this.size.y, this.size.z), this.borderMaterial, "yz"),
          'rightBorder': new Border(new Utils.place(this.size.x / 2 - this.borderWidth / 2, 0, 0), new Utils.size(this.borderWidth, this.size.y, this.size.z), this.borderMaterial, "yz"),
          'backBorder': new Border(new Utils.place(0, 0, -this.size.z / 2 + this.borderWidth / 2), new Utils.size(this.size.x, this.size.y, this.borderWidth), this.backBorderMaterial, "xy"),
          'frontBorder': new Door(new Utils.place(0, 0, this.size.z / 2 - this.borderWidth / 2), new Utils.size(this.size.x, this.size.y, this.borderWidth), this.borderMaterial, "xy", "Left", "slide", false)
        };
        this.bottomStoragePlace = new Utils.place(0, -this.size.y / 2 - this.bottomStorageHeigth / 2, 0);
        this.topStoragePlace = new Utils.place(0, 0 + this.size.y / 2 + this.topStorageHeight / 2, 0);
        this.storageStands = {
          'bottomStorage': {
            'leftBorder': new Border(new Utils.place(this.bottomStoragePlace.x - this.size.x / 2 + this.borderWidth / 2, this.bottomStoragePlace.y, this.bottomStoragePlace.z), new Utils.size(this.borderWidth, this.bottomStorageHeigth, this.size.z), this.storageMaterial, "yz"),
            'rightBorder': new Border(new Utils.place(this.bottomStoragePlace.x + this.size.x / 2 - this.borderWidth / 2, this.bottomStoragePlace.y, this.bottomStoragePlace.z), new Utils.size(this.borderWidth, this.bottomStorageHeigth, this.size.z), this.storageMaterial, "yz"),
            'backBorder': new Border(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y, this.bottomStoragePlace.z - this.size.z / 2 + this.borderWidth / 2), new Utils.size(this.size.x, this.bottomStorageHeigth, this.borderWidth), this.storageMaterial, "xy"),
            'frontBorder': new Door(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y, this.bottomStoragePlace.z + this.size.z / 2 - this.borderWidth / 2), new Utils.size(this.size.x, this.bottomStorageHeigth, this.borderWidth), this.storageMaterial, "xy", "Left", "border", false),
            'bottomBorder': new Border(new Utils.place(this.bottomStoragePlace.x, this.bottomStoragePlace.y - this.bottomStorageHeigth / 2 + this.borderWidth / 2, this.bottomStoragePlace.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), this.storageMaterial, "xz")
          },
          'topStorage': {
            'leftBorder': new Border(new Utils.place(this.topStoragePlace.x - this.size.x / 2 + this.borderWidth / 2, this.topStoragePlace.y, this.topStoragePlace.z), new Utils.size(this.borderWidth, this.topStorageHeight, this.size.z), this.storageMaterial, "yz"),
            'rightBorder': new Border(new Utils.place(this.topStoragePlace.x + this.size.x / 2 - this.borderWidth / 2, this.topStoragePlace.y, this.topStoragePlace.z), new Utils.size(this.borderWidth, this.topStorageHeight, this.size.z), this.storageMaterial, "yz"),
            'backBorder': new Border(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y, this.topStoragePlace.z - this.size.z / 2 + this.borderWidth / 2), new Utils.size(this.size.x, this.topStorageHeight, this.borderWidth), this.storageMaterial, "xy"),
            'frontBorder': new Door(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y, this.topStoragePlace.z + this.size.z / 2 - this.borderWidth / 2), new Utils.size(this.size.x, this.topStorageHeight, this.borderWidth), this.storageMaterial, "xy", "Left", "border", false),
            'topBorder': new Border(new Utils.place(this.topStoragePlace.x, this.topStoragePlace.y + this.topStorageHeight / 2 - this.borderWidth / 2, this.topStoragePlace.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), this.storageMaterial, "xz")
          }
        };
        winding = (function(_this) {
          return function(border, width) {
            var borderWinding, depth, i, j, k, kx, ky, kz, placeX, placeY, placeZ, sizeX, sizeY, sizeZ;
            borderWinding = new THREE.Object3D;
            depth = 10;
            for (kx = i = -1; i <= 1; kx = ++i) {
              for (ky = j = -1; j <= 1; ky = ++j) {
                for (kz = k = -1; k <= 1; kz = ++k) {
                  if (Math.abs(kx) + Math.abs(ky) + Math.abs(kz) === 2) {
                    placeX = border.place.x + kx * border.size.x / 2;
                    placeY = border.place.y + ky * border.size.y / 2;
                    placeZ = border.place.z + kz * border.size.z / 2;
                    switch (border.planeName) {
                      case "xy":
                        if (kz === 0) {
                          continue;
                        }
                        if (Math.abs(kx) + Math.abs(ky) !== 1) {
                          continue;
                        }
                        sizeX = ky !== 0 ? border.size.x : width;
                        sizeY = kx !== 0 ? border.size.y : width;
                        sizeZ = depth;
                        placeX -= kx * width / 2;
                        placeY -= ky * width / 2;
                        break;
                      case "xz":
                        if (ky === 0) {
                          continue;
                        }
                        if (Math.abs(kx) + Math.abs(kz) !== 1) {
                          continue;
                        }
                        sizeX = kz !== 0 ? border.size.x : width;
                        sizeY = depth;
                        sizeZ = kx !== 0 ? border.size.z : width;
                        placeX -= kx * width / 2;
                        placeZ -= kz * width / 2;
                        break;
                      case "yz":
                        if (kx === 0) {
                          continue;
                        }
                        if (Math.abs(ky) + Math.abs(kz) !== 1) {
                          continue;
                        }
                        sizeX = depth;
                        sizeY = kz !== 0 ? border.size.y : width;
                        sizeZ = ky !== 0 ? border.size.z : width;
                        placeY -= ky * width / 2;
                        placeZ -= kz * width / 2;
                    }
                    borderWinding.add(new Border(new Utils.place(placeX, placeY, placeZ), new Utils.size(sizeX, sizeY, sizeZ), Materials.winding));
                  }
                }
              }
            }
            return borderWinding;
          };
        })(this);
        ref = Object.keys(this.borders);
        for (i = 0, len = ref.length; i < len; i++) {
          borderName = ref[i];
          this.add(this.borders[borderName]);
        }
        ref1 = Object.keys(this.storageStands);
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          storageName = ref1[j];
          ref2 = Object.keys(this.storageStands[storageName]);
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            ind2 = ref2[k];
            this.add(this.storageStands[storageName][ind2]);
          }
        }
        windingWidth = 10;
        ref3 = Object.keys(this.borders);
        for (l = 0, len3 = ref3.length; l < len3; l++) {
          borderName = ref3[l];
          this.add(winding(this.borders[borderName], windingWidth));
        }
        ref4 = Object.keys(this.storageStands);
        for (m = 0, len4 = ref4.length; m < len4; m++) {
          storageName = ref4[m];
          ref5 = Object.keys(this.storageStands[storageName]);
          for (n = 0, len5 = ref5.length; n < len5; n++) {
            ind2 = ref5[n];
            this.add(winding(this.storageStands[storageName][ind2], windingWidth));
          }
        }
      }

      ShowCase.prototype.changeDoor = function(doorContainer, type, isDouble) {
        var borderPlace, borderSize, container, doorMaterial;
        switch (doorContainer) {
          case "border":
            container = this.borders;
            break;
          case "storageTop":
            container = this.storageStands.topStorage;
            if (container.size.y < 600) {
              return;
            }
            break;
          case "storageBottom":
            container = this.storageStands.bottomStorage;
            if (container.size.y < 600) {
              return;
            }
        }
        borderPlace = new THREE.Vector3(container.frontBorder.place.x, container.frontBorder.place.y, container.frontBorder.place.z);
        borderSize = new THREE.Vector3(container.frontBorder.size.x, container.frontBorder.size.y, container.frontBorder.size.z);
        doorMaterial = container.frontBorder.material;
        this.removeChildrenObject(container.frontBorder);
        container.frontBorder = new Door(new Utils.place(borderPlace.x, borderPlace.y, borderPlace.z), new Utils.size(borderSize.x, borderSize.y, this.borderWidth), doorMaterial, "xy", "Left", type, isDouble);
        return this.add(container.frontBorder);
      };

      ShowCase.prototype.changeSize = function(size) {
        this.removeChildrenObject(this);
        return this.addChildrenObject(new ShowCase(new Utils.place(this.place.x, this.place.y + size.y - this.size.y, this.place.z), size, this.borderMaterial, this.backBorderMaterial, this.bottomStorageHeigth, this.topStorageHeight, this.storageMaterial));
      };

      ShowCase.prototype.changeBorderMaterial = function(material) {
        var borderName, i, len, mesh, ref, results;
        this.borderMaterial = material;
        ref = Object.keys(this.borders);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          borderName = ref[i];
          results.push((function() {
            var j, len1, ref1, results1;
            ref1 = this.borders[borderName].children;
            results1 = [];
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              mesh = ref1[j];
              results1.push(mesh.material = material);
            }
            return results1;
          }).call(this));
        }
        return results;
      };

      ShowCase.prototype.changeBorderThickness = function(thickness) {
        var axis, borderName, i, j, k, l, len, len1, len2, len3, mesh, ref, ref1, ref2, ref3, results, scale, size, storageName, storageType;
        scale = thickness / this.borderWidth;
        ref = Object.keys(this.borders);
        for (i = 0, len = ref.length; i < len; i++) {
          borderName = ref[i];
          ref1 = this.borders[borderName].children;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            mesh = ref1[j];
            size = Utils.getObjectSize(mesh);
            ref2 = ['x', 'y', 'z'];
            for (k = 0, len2 = ref2.length; k < len2; k++) {
              axis = ref2[k];
              if (size[axis] === this.borderWidth) {
                mesh.scale[axis] = scale;
              }
            }
          }
        }
        ref3 = Object.keys(this.storageStands);
        results = [];
        for (l = 0, len3 = ref3.length; l < len3; l++) {
          storageType = ref3[l];
          results.push((function() {
            var len4, m, ref4, results1;
            ref4 = Object.keys(this.storageStands[storageType]);
            results1 = [];
            for (m = 0, len4 = ref4.length; m < len4; m++) {
              storageName = ref4[m];
              results1.push((function() {
                var len5, n, ref5, results2;
                ref5 = this.storageStands[storageType][storageName].children;
                results2 = [];
                for (n = 0, len5 = ref5.length; n < len5; n++) {
                  mesh = ref5[n];
                  size = Utils.getObjectSize(mesh);
                  results2.push((function() {
                    var len6, o, ref6, results3;
                    ref6 = ['x', 'y', 'z'];
                    results3 = [];
                    for (o = 0, len6 = ref6.length; o < len6; o++) {
                      axis = ref6[o];
                      if (size[axis] === this.borderWidth) {
                        results3.push(mesh.scale[axis] = scale);
                      } else {
                        results3.push(void 0);
                      }
                    }
                    return results3;
                  }).call(this));
                }
                return results2;
              }).call(this));
            }
            return results1;
          }).call(this));
        }
        return results;
      };

      ShowCase.prototype.addShelf = function(height) {
        height = Math.min(Math.max(0, height), this.size.y - this.topStorageHeight);
        this.shelfs.push(new Border(new Utils.place(this.place.x, this.place.y + height - this.size.y / 2, this.place.z), new Utils.size(this.size.x, this.borderWidth, this.size.z), Materials.glass));
        this.bOrder(this.shelfs.last());
        return this.addChildrenObject.call(this, this.shelfs.last());
      };

      ShowCase.prototype.getParts = function() {
        var border, details, i, j, len, len1, ref, ref1, shelf;
        details = [];
        console.log(this.children);
        ref = Object.keys(this.borders);
        for (i = 0, len = ref.length; i < len; i++) {
          border = ref[i];
          details.push(this.borders[border].getParts());
        }
        ref1 = this.shelfs;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          shelf = ref1[j];
          details.push(shelf.getParts());
        }
        return details;
      };

      return ShowCase;

    })(physicalObject);
  });

}).call(this);

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('controls',['utils', 'interface', 'showcase'], function(Utils, Interface, ShowCase) {
    var Controls;
    return Controls = (function(superClass) {
      extend(Controls, superClass);

      function Controls(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.removeControllableObject = bind(this.removeControllableObject, this);
        this.moveControllableObject = bind(this.moveControllableObject, this);
        this.findIntersect = bind(this.findIntersect, this);
        this.clickOnObject = bind(this.clickOnObject, this);
        this.onMouseMove = bind(this.onMouseMove, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.raycaster = new THREE.Raycaster;
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('mousedown', this.onMouseDown, false);
        this.mouse = new THREE.Vector3;
        this.state = {
          activeState: 'waiting',
          waiting: {
            mouseMove: this.findIntersect,
            mouseClick: this.clickOnObject
          },
          controlObject: {
            mouseMove: this.moveControllableObject,
            mouseClick: this.removeControllableObject
          }
        };
        this.controllableObject = null;
        this.activeMesh = {
          object: null,
          material: null
        };
        this.material = new THREE.MeshLambertMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.3
        });
      }

      Controls.prototype.onMouseDown = function(event) {
        return this.state[this.state.activeState].mouseClick();
      };

      Controls.prototype.onMouseMove = function(event) {
        event.preventDefault();
        if (event.which) {
          this.engine.rotateCamera(event.movementX * 0.2);
        }
        this.mouse.x = (event.clientX / this.canvas.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.canvas.height) * 2 + 1.3;
        return this.state[this.state.activeState].mouseMove();
      };

      Controls.prototype.setActiveMesh = function(mesh) {
        if (!(this.activeMesh.object === mesh && this.activeMesh.object !== null)) {
          if (this.activeMesh.object !== null) {
            this.activeMesh.object.material = this.activeMesh.material;
          }
          this.activeMesh.object = mesh;
          this.activeMesh.material = mesh.material;
          return this.activeMesh.object.material = this.material;
        }
      };

      Controls.prototype.clickOnObject = function() {
        var obj;
        if (this.activeMesh.object === null) {
          Interface.fillBlockFields(false);
          return;
        }
        obj = this.activeMesh.object;
        while (obj.parent !== null) {
          if (obj.parent instanceof ShowCase) {
            Interface.clickOnShowCase(obj.parent);
            break;
          }
          obj = obj.parent;
        }
        return this.activeMesh.object.parent.click(event);
      };

      Controls.prototype.findIntersect = function() {
        var intersects;
        this.raycaster.setFromCamera(this.mouse, this.engine.camera);
        intersects = this.raycaster.intersectObjects(this.engine.scene.children, true);
        if (intersects.length > 0) {
          if (intersects.first() !== this.activeMesh.object) {
            return this.setActiveMesh(intersects.first().object);
          }
        } else {
          if (this.activeMesh.object !== null) {
            this.activeMesh.object.material = this.activeMesh.material;
          }
          return this.activeMesh.object = null;
        }
      };

      Controls.prototype.moveControllableObject = function() {
        var dir, distance, pos, vector;
        if (this.controllableObject) {
          vector = this.mouse.unproject(this.engine.camera);
          dir = vector.sub(this.engine.camera.position).normalize();
          distance = -this.engine.camera.position.z / dir.z;
          pos = this.engine.camera.position.clone().add(dir.multiplyScalar(distance));
          this.controllableObject.position.x = pos.x;
          return this.controllableObject.position.y = pos.y;
        }
      };

      Controls.prototype.createControllableObject = function(object, callback) {
        var listener;
        this.state.activeState = 'controlObject';
        this.controllableObject = object;
        return this.addEventListener('remove', listener = function(event) {
          callback(event.detail);
          return this.removeEventListener('remove', listener);
        });
      };

      Controls.prototype.removeControllableObject = function() {
        var event;
        event = new CustomEvent('remove', {
          detail: this.controllableObject
        });
        this.dispatchEvent(event);
        this.controllableObject.removeChildrenObject(this.controllableObject);
        this.controllableObject = null;
        return this.state.activeState = 'waiting';
      };

      return Controls;

    })(THREE.EventDispatcher);
  });

}).call(this);

(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define('engine',['controls', 'utils', 'showcase'], function(Controls, Utils, ShowCase) {
    var Engine;
    return Engine = (function(superClass) {
      extend(Engine, superClass);

      function Engine() {
        this.rotateCamera = bind(this.rotateCamera, this);
        this.nextCamera = bind(this.nextCamera, this);
        this.addToScene = bind(this.addToScene, this);
        this.event = new CustomEvent('render', {});
        this.lastAngle = 0;
        this._initialize();
        this.camAngle = 0;
        this._initializeCameras();
        this._initializeSpotilights();
        this._addAxes(2000);
        this.controls = new Controls(this.renderer.domElement, this);
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

      Engine.prototype.rotateCamera = function(angleDegrees) {
        var angle, cameraPosition, distance;
        cameraPosition = new Utils.place(this.camera.position.x, 0, this.camera.position.z);
        distance = Utils.getDistance(cameraPosition, this.scene.position);
        angle = this.lastAngle + angleDegrees.toRadians();
        this.camera.position.z = distance * Math.cos(angle);
        this.camera.position.x = distance * Math.sin(angle);
        this.lastAngle = angle;
        return this.camera.lookAt(this.scene.position);
      };

      Engine.prototype.getCloserShowCase = function(position) {
        var currentShowCase, i, len, minDistance, ref, showcase;
        currentShowCase = null;
        minDistance = null;
        ref = this.scene.children;
        for (i = 0, len = ref.length; i < len; i++) {
          showcase = ref[i];
          if (showcase instanceof ShowCase) {
            if (minDistance === null || minDistance > Utils.getDistance(position, showcase.place)) {
              currentShowCase = showcase;
              minDistance = Utils.getDistance(position, showcase.place);
            }
          }
        }
        return currentShowCase;
      };

      Engine.prototype.viewObject = function(object) {
        var correction, sizes, viewAngle;
        correction = -5;
        viewAngle = (this.camera.fov / 2).toRadians();
        sizes = Utils.getObjectSize(object);
        this.camera.position.z = object.position.z;
        this.camera.position.y = object.position.y;
        this.camera.position.x = object.position.x - sizes.x / 2 + correction - (Math.cos(viewAngle) * sizes.y / 2) / Math.sin(viewAngle);
        return this.camera.lookAt(object.position);
      };

      Engine.prototype.run = function() {
        var renderScene;
        renderScene = (function(_this) {
          return function() {
            _this.dispatchEvent(_this.event);
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
        spotlight.position.set(-60, 30, -10);
        this.scene.add(spotlight);
        spotlight.position.set(32, 30, 0);
        return this.scene.add(spotlight);
      };

      Engine.prototype._initializeCameras = function() {
        this.cameraDistance = {
          x: 1000,
          y: 1500,
          z: 0
        };
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.x = -this.cameraDistance.x;
        this.camera.position.y = this.cameraDistance.y;
        this.camera.position.z = this.cameraDistance.z;
        this.camera.lookAt(this.scene.position);
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
  define('calculations',[], function() {
    var Calculations;
    Number.prototype.toMetres = function() {
      return this / 1000;
    };
    Calculations = (function() {
      function Calculations(configurationFile) {
        var request;
        request = new XMLHttpRequest;
        request.open('GET', '../config/configurationTable.json', true);
        request.onload = function(event) {
          return this.config = JSON.parse(this.responseText);
        };
        request.send();
      }

      Calculations.prototype.getGlassCost = function(thickness, width, height, grinding, polishing) {
        var length, square;
        square = width.toMetres() * height.toMetres();
        length = width.toMetres() * height.toMetres() * 2;
        return {
          square: square,
          length: length,
          cost: square * this.config.glassCost + length * (this.config.grindingCost + this.config.polishingCost)
        };
      };

      return Calculations;

    })();
    return new Calculations('../config/configurationTable.json');
  });

}).call(this);

(function() {
  require(['engine', 'physicalObject', 'utils', 'materials', 'showcase', 'border', 'calculations'], function(Engine, physicalObject, Utils, Materials, ShowCase, Border, Calculations) {
    var engine, i, obj;
    engine = new Engine;
    i = 20;
    obj = new ShowCase(new Utils.place(0, 0, 0), new Utils.size(900, 2050, 400), Materials.glass, Materials.glass, 300, 100, Materials.panel);
    engine.addToScene(obj);
    document.getElementById('changeCamera').onclick = function() {
      return engine.nextCamera();
    };
    document.getElementById('centerCamera').onclick = function() {
      return engine.viewObject(obj);
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
      var bord;
      bord = new Border(new Utils.place(0, 0, 0), new Utils.size(obj.size.x, 10, obj.size.z), Materials.glass);
      bord.bOrder(bord);
      engine.addToScene(bord);
      return engine.controls.createControllableObject(bord, function(shelf) {
        var showcase;
        showcase = engine.getCloserShowCase(bord.position);
        return showcase.addShelf(shelf.position.y + obj.size.y / 2);
      });
    };
    document.getElementById('rotateLeft').onclick = function() {
      return engine.rotateCamera(-5);
    };
    document.getElementById('rotateRight').onclick = function() {};
    engine.addEventListener("render", function() {
      return obj.borders["frontBorder"].moving();
    });
    engine.addEventListener("render", function() {
      return obj.storageStands.topStorage["frontBorder"].moving();
    });
    engine.addEventListener("render", function() {
      return obj.storageStands.bottomStorage["frontBorder"].moving();
    });
    return console.dir(obj.getParts());
  });

}).call(this);

define("main", function(){});

require(["main"]);
}());