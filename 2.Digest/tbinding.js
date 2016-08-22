var Scope = function() {
    this.watchers = [];



    var self = this;
    var elements = document.querySelectorAll('[ng-model]');

    for(var i = 0, len =elements.length; i < len; i++){
        
        (function(i) {
            self.watch(function() {
                return self.str2PropGet(elements[i].getAttribute('ng-model'));
            }, function() {
                var elementType = elements[i].tagName.toLowerCase();

                if(elementType === 'input' || elementType === 'textarea' || elementType === 'select') {
                    elements[i].value = self.str2PropGet(elements[i].getAttribute('ng-model'));
                } else {
                    elements[i].innerHTML = self.str2PropGet(elements[i].getAttribute('ng-model'));
                }
            });
        })(i);

    }

    function pageElementEventHandler(e) {
        var target = e.target || e.srcElemnt;
        var fullPropName = target.getAttribute('ng-model');

        if(fullPropName && fullPropName !== '') {
            self.str2PropSet(target.getAttribute('ng-model'), target.value);
            self.digest();
        }

    }

    if(document.addEventListener) {
        document.addEventListener('keyup', pageElementEventHandler, false);
        document.addEventListener('change', pageElementEventHandler, false);
    } else {
        document.attachEvent('onkeyup', pageElementEventHandler);
        document.attachEvent('onchange', pageElementEventHandler);
    } 

};



Scope.prototype.watch = function(watchExp, callback) {
    this.watchers.push({
        watchExp: watchExp,
        callback: callback || function() {}
    });

}

Scope.prototype.digest = function() {
    var dirty;

    do { 
        dirty = false;

        for(var i = 0; i < this.watchers.length; i++) {
            var newVal = this.watchers[i].watchExp(),
                oldVal = this.watchers[i].last;

            if(newVal !== oldVal) {
                this.watchers[i].callback(newVal, oldVal);
                dirty = true;
                this.watchers[i].last = newVal;
            }
        }
    } while(dirty);

}

Scope.prototype.str2PropGet = function(propPath) {
    var props = propPath.split('.');
    var result = this;

    for(var i = 0; i < props.length; i++) {
        result = result[props[i]];
    }
    return result;
}

Scope.prototype.str2PropSet = function(propPath, value) {
    var props = propPath.split('.');
    var result = this;

    for(var i = 0; i < props.length - 1; i++) {
        result = result[props[i]];
    }

    result[props[i]] = value;
}



