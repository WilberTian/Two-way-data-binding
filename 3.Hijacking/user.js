
var user = TBinding.initModel('user');

user.loadModelData({
    'name': 'wilber',
    'age': 29,
    'gender': 2
})

user.incAge = function() {
    this.age += 1;
}

user.decAge = function() {
    this.age -= 1;
}


