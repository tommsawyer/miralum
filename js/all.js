!function(){var n,e,t;!function(i){function r(n,e){return x.call(n,e)}function o(n,e){var t,i,r,o,u,f,c,l,s,a,p,d=e&&e.split("/"),g=y.map,m=g&&g["*"]||{};if(n&&"."===n.charAt(0))if(e){for(n=n.split("/"),u=n.length-1,y.nodeIdCompat&&j.test(n[u])&&(n[u]=n[u].replace(j,"")),n=d.slice(0,d.length-1).concat(n),s=0;s<n.length;s+=1)if(p=n[s],"."===p)n.splice(s,1),s-=1;else if(".."===p){if(1===s&&(".."===n[2]||".."===n[0]))break;s>0&&(n.splice(s-1,2),s-=2)}n=n.join("/")}else 0===n.indexOf("./")&&(n=n.substring(2));if((d||m)&&g){for(t=n.split("/"),s=t.length;s>0;s-=1){if(i=t.slice(0,s).join("/"),d)for(a=d.length;a>0;a-=1)if(r=g[d.slice(0,a).join("/")],r&&(r=r[i])){o=r,f=s;break}if(o)break;!c&&m&&m[i]&&(c=m[i],l=s)}!o&&c&&(o=c,f=l),o&&(t.splice(0,f,o),n=t.join("/"))}return n}function u(n,e){return function(){var t=w.call(arguments,0);return"string"!=typeof t[0]&&1===t.length&&t.push(null),d.apply(i,t.concat([n,e]))}}function f(n){return function(e){return o(e,n)}}function c(n){return function(e){h[n]=e}}function l(n){if(r(v,n)){var e=v[n];delete v[n],b[n]=!0,p.apply(i,e)}if(!r(h,n)&&!r(b,n))throw new Error("No "+n);return h[n]}function s(n){var e,t=n?n.indexOf("!"):-1;return t>-1&&(e=n.substring(0,t),n=n.substring(t+1,n.length)),[e,n]}function a(n){return function(){return y&&y.config&&y.config[n]||{}}}var p,d,g,m,h={},v={},y={},b={},x=Object.prototype.hasOwnProperty,w=[].slice,j=/\.js$/;g=function(n,e){var t,i=s(n),r=i[0];return n=i[1],r&&(r=o(r,e),t=l(r)),r?n=t&&t.normalize?t.normalize(n,f(e)):o(n,e):(n=o(n,e),i=s(n),r=i[0],n=i[1],r&&(t=l(r))),{f:r?r+"!"+n:n,n:n,pr:r,p:t}},m={require:function(n){return u(n)},exports:function(n){var e=h[n];return"undefined"!=typeof e?e:h[n]={}},module:function(n){return{id:n,uri:"",exports:h[n],config:a(n)}}},p=function(n,e,t,o){var f,s,a,p,d,y,x=[],w=typeof t;if(o=o||n,"undefined"===w||"function"===w){for(e=!e.length&&t.length?["require","exports","module"]:e,d=0;d<e.length;d+=1)if(p=g(e[d],o),s=p.f,"require"===s)x[d]=m.require(n);else if("exports"===s)x[d]=m.exports(n),y=!0;else if("module"===s)f=x[d]=m.module(n);else if(r(h,s)||r(v,s)||r(b,s))x[d]=l(s);else{if(!p.p)throw new Error(n+" missing "+s);p.p.load(p.n,u(o,!0),c(s),{}),x[d]=h[s]}a=t?t.apply(h[n],x):void 0,n&&(f&&f.exports!==i&&f.exports!==h[n]?h[n]=f.exports:a===i&&y||(h[n]=a))}else n&&(h[n]=t)},n=e=d=function(n,e,t,r,o){if("string"==typeof n)return m[n]?m[n](e):l(g(n,e).f);if(!n.splice){if(y=n,y.deps&&d(y.deps,y.callback),!e)return;e.splice?(n=e,e=t,t=null):n=i}return e=e||function(){},"function"==typeof t&&(t=r,r=o),r?p(i,n,e,t):setTimeout(function(){p(i,n,e,t)},4),d},d.config=function(n){return d(n)},n._defined=h,t=function(n,e,t){if("string"!=typeof n)throw new Error("See almond README: incorrect module build, no module name");e.splice||(t=e,e=[]),r(h,n)||r(v,n)||(v[n]=[n,e,t])},t.amd={jQuery:!0}}(),t("../bower_components/almond/almond",function(){}),function(){t("engine",[],function(){var n;return n=function(){function n(n){this.canvas=n,this._initialize()}return n.prototype._initialize=function(){return console.log("init")},n}()})}.call(this),function(){e(["engine"],function(n){var e,t;return e=document.getElementById("canvas"),t=new n(e)})}.call(this),t("main",function(){}),e(["main"])}();