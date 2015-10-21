(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define(['physicalObject', 'engine'], function(physicalObject, Engine) {
    var Border;
    return Border = (function(superClass) {
      extend(Border, superClass);

      function Border(place, size, material, planeName) {
        this.place = place;
        this.size = size;
        this.material = material;
        this.planeName = planeName;
        Border.__super__.constructor.call(this, this.place, this.size, this.material);
      }

      return Border;

    })(physicalObject);
  });

}).call(this);
