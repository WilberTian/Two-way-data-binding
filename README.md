很多的前端框架都支持数据双向绑定了，最近正好在看双向绑定的实现，就用Javascript写了几个简单的例子。

几个例子中尝试使用了下面的方式实现双向绑定：

1. 发布/订阅模式
2. 属性劫持
3. 脏数据检测



### 发布/订阅模式

实现数据双向绑定最直接的方式就是使用PubSub模式：

- 当model发生改变的时候，触发Model change事件，然后通过响应的事件处理函数更新界面
- 当界面更新的时候，触发UI change事件， 然后通过相应的事件处理函数更新Model，以及绑定在Model上的其他界面控件

根据这个思路，可以定义'ui-update-event'和'model-update-event'两个事件，然后针对Model和UI分别进行这两个事件订阅和发布。


#### UI更新
对于所有支持双向绑定的页面控件，当控件的“值”发生改变的时候，就触发'ui-update-event'，然后通过事件处理函数更新Model，以及绑定在Model上的其他界面控件

处理控件“值”的改变，发布“ui-update-event”事件，（这里只处理包含“t-binding”属性的控件）：

    // keyup和change事件处理函数
    function pageElementEventHandler(e) {
        var target = e.target || e.srcElemnt;
        var fullPropName = target.getAttribute('t-binding');

        if(fullPropName && fullPropName !== '') {
            Pubsub.publish('ui-update-event', fullPropName, target.value);
        }

    }
    
    // 在页面上添加keyup和change的listener
    if(document.addEventListener) {
        document.addEventListener('keyup', pageElementEventHandler, false);
        document.addEventListener('change', pageElementEventHandler, false);
    } else {
        document.attachEvent('onkeyup', pageElementEventHandler);
        document.attachEvent('onchange', pageElementEventHandler);
    } 
    
另外，对所有包含“t-binding”属性的控件都订阅了“'model-update-event”，也就是当Model变化的时候会收到相应的通知：

    // 订阅model-update-event事件, 根据Model对象的变化更新相关的UI
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

#### Model更新

对于Model这一层，当Model发生改变的时候，会发布“model-update-event”：

	// Model对象更新方法，更新对象的同时发布model-update-event事件
    'updateModelData': function(propName, propValue) {    
        eval(this.modelName)[propName] =propValue;   
        Pubsub.publish('model-update-event', this.modelName + '.' + propName, propValue);
    }

另外，Model订阅了“ui-update-event”，相应的界面改动会更新Model

    // 订阅ui-update-event事件, 将UI的变化对应的更新Model对象
    Pubsub.subscrib('ui-update-event', function(fullPropName, propValue) {
        var propPathArr = fullPropName.split('.');
        self.updateModelData(propPathArr[1], propValue);
    });
    
    
有了这些代码，一个简单的双向绑定例子就可以运行起来了：

> 1. 初始状态  
![1 1](https://cloud.githubusercontent.com/assets/5880320/18007454/b8b5892e-6bd6-11e6-9bfb-bf7a6c1a0458.PNG)

> 2. UI变化，Model会更新，绑定在Model上的其他控件也被更新  
![1 2](https://cloud.githubusercontent.com/assets/5880320/18007447/b4967b50-6bd6-11e6-8f35-f13753e1b342.PNG)

> 3. 通过"updateModelData"更新Model，绑定在Model上的控件被更新  
![1 3](https://cloud.githubusercontent.com/assets/5880320/18007451/b64c3728-6bd6-11e6-825d-b4940628c4fb.PNG)
    
    
**完整的代码请参考[Two-way-data-binding:PubSub](https://github.com/WilberTian/Two-way-data-binding)。**


    
    
### 属性劫持

在“发布/订阅模式”实现双向绑定的例子中，为了保证Model的更新能够发布“model-update-event”，对于Model对象的改变必须通过“updateModelData”方法。     
也就是说，通过Javascript对象字面量直接更新对象就没有办法触发双向绑定。

Javascript中提供了“Object.defineProperty”方法，通过这个方法可以对对象的属性进行定制。

结合“Object.defineProperty”和“发布/订阅模式”，对Model属性的set方法进行重定义，将“model-update-event”事件的发布直接放在Model属性的setter中：

    'defineObjProp': function(obj, propName, propValue) {
        var self = this;

        var _value = propValue || '';

        try {
            Object.defineProperty(obj, propName, {
                get: function() {
                    return _value; 
                },
                
				// 在对象属性的setter中添加model-update-event事件发布动作
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


这样，就可以使用对象字面量的方式直接对Model对象进行修改：   

![2](https://cloud.githubusercontent.com/assets/5880320/18007450/b5b06a00-6bd6-11e6-8d2a-ab4933472736.PNG)

    
*但是，对于IE8及以下浏览器仍需要使用其它方法来做hack。*


**完整的代码请参考[Two-way-data-binding:Hijacking](https://github.com/WilberTian/Two-way-data-binding)。**




### 脏数据检测

对于AngularJS，是通过脏数据检测来实现双向绑定的，下面就仿照脏数据检测来实现一个简单的双向绑定。

在这个例子中，作用域scope对象中会维护一个“watcher”数组，用来存放所以需要检测的表达式，以及对应的回调处理函数。

对于所有需要检测的对象、属性，scope通过“watch”方法添加到“watcher”数组中：

    Scope.prototype.watch = function(watchExp, callback) {
        this.watchers.push({
            watchExp: watchExp,
            callback: callback || function() {}
        });

    }

    
当Model对象发生变化的时候，调用“digest”方法进行脏检测，如果发现脏数据，就调用对应的回调函数进行界面的更新：
    
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

**完整的代码请参考[Two-way-data-binding:Digest](https://github.com/WilberTian/Two-way-data-binding)。**
    



