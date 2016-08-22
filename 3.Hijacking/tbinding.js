
var Pubsub = {
    subscrib: function(ev, callback) {
        this._callbacks || (this._callbacks = {});
        (this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);
        
        return this;        
    },

    publish: function() {
        var args = Array.prototype.slice.call(arguments);
        
        var ev = args.shift();
        
        if(!this._callbacks) return this;
        if(!this._callbacks[ev]) return this;
        
        for(var i = 0; i < this._callbacks[ev].length; i++) {
            this._callbacks[ev][i].apply(this, args);
        }
        
        return this;
    }
}


var TBinding = (function(){

    function pageElementEventHandler(e) {
        var target = e.target || e.srcElemnt;
        var fullPropName = target.getAttribute('t-binding');

        if(fullPropName && fullPropName !== '') {
            Pubsub.publish('ui-update-event', fullPropName, target.value);
        }

    }
    

    if(document.addEventListener) {
        document.addEventListener('keyup', pageElementEventHandler, false);
        document.addEventListener('change', pageElementEventHandler, false);
    } else {
        document.attachEvent('onkeyup', pageElementEventHandler);
        document.attachEvent('onchange', pageElementEventHandler);
    } 

    Pubsub.subscrib('model-update-event', function(fullPropName, propValue) {   
        var elements = document.querySelectorAll('[t-binding="' + fullPropName + '"]');

        for(var i = 0, len =elements.length; i < len; i++){
            var elementType = elements[i].tagName.toLowerCase();

            if(elementType === 'input' || elementType === 'textarea' || elementType === 'select') {
                elements[i].value = propValue;
            } else {
                elements[i].innerHTML = propValue;
            }

        }
    });


    return {
        'modelName': '',

        'initModel': function(modelName) {
            this.modelName = modelName;

            Pubsub.subscrib('ui-update-event', function(fullPropName, propValue) {
                var propPathArr = fullPropName.split('.');

                eval(propPathArr[0])[propPathArr[1]] = propValue;
            });

            return Object.create(this);
        }, 

        'loadModelData': function(modelData) {
            for(prop in modelData) {
                this.defineObjProp(this, prop, modelData[prop]);
            }
        },

        'defineObjProp': function(obj, propName, propValue) {
            var self = this;

            var _value = propValue || '';

            try {
                Object.defineProperty(obj, propName, {
                    get: function() {
                        return _value; 
                    },

                    set: function(newValue) {
                        _value = newValue;
                        Pubsub.publish('model-update-event', self.modelName + '.' + propName, newValue);
                    },
                    enumerable: true,
                    configurable: true
                });

                obj[propName] = _value;
            } catch (error) {
                alert("Browser must be IE8+ !");
            }
        }

        
    }

})();






