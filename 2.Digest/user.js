var scope = new Scope();

scope.user = {
    'name': 'wilber',
    'age': 29,
    'gender': 2
};

scope.user.incAge = function() {
    scope.user.age += 1;
    scope.digest();
}

scope.user.decAge = function() {
    scope.user.age -= 1;
    scope.digest();
}

// manually run the digest during the initializtion stage
scope.digest();

