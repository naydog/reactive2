describe("Reactive suite:", function () {
    var a;
    beforeEach(function () {
        a = {
            a: 1,
            b: {
                c: 2,
                d: 3,
                f: {
                    h: 'aaa'
                },
                g: [4, 5]
            },
            c: [1, 2, 3]
        };
        for (var i in a) {
            reactivejs.set(a, i, a[i]);
        }
    });

    it("Set new property", function () {
        reactivejs.set(a, 'd', 3);
        expect(a.d).toEqual(3);
    });

    it("Set duplicate property", function () {
        reactivejs.set(a, 'a', 3);
        expect(a.a).toEqual(3);
    });

    it("Init property by set setter", function () {
        var inWatch = '';
        reactivejs.set(a, 'd', function (val) {
            inWatch += val;
        });
        a.d = 5;
        expect(inWatch).toEqual('5');
    })


    it("Set new property by reference", function () {
        var b = {};
        // If b.c is set to a.b through "setByRef", a.b will change when b.c is re-assigned
        reactivejs.setByRef(b, 'c', a, 'b');
        b.c = 2;
        expect(b.c).toEqual(a.b);
    });

    it("SetByRef property back", function () {
        var b = {};
        reactivejs.setByRef(b, 'c', a, 'b');
        reactivejs.setByRef(a, 'aa', b, 'c');

        a.aa = 4;
        // a.aa & a.b have same getter and setter
        expect(a.aa).toEqual(a.b);
    });

    it("Circular reference error - direct", function () {
        var b = {};
        reactivejs.setByRef(b, 'c', a, 'b');

        expect(function () {
            reactivejs.setByRef(a, 'b', b, 'c');
        }).toThrow("Circular reference error");
    });

    it("Circular reference error - indirect", function () {
        reactivejs.set(a, 'aa', 1);

        var b = {};
        reactivejs.setByRef(b, 'bb', a, 'aa');

        var c = {};
        reactivejs.setByRef(c, 'cc', b, 'bb');

        expect(function () {
            reactivejs.setByRef(a, 'aa', c, 'cc');
        }).toThrow("Circular reference error");
    });
});


describe("Reactive suite 2:", function () {
    var a;
    beforeEach(function () {
        a = {
            a: 1,
            b: {
                c: 2,
                d: 3,
                f: {
                    h: 'aaa'
                },
                g: [4, 5]
            },
            c: [1, 2, 3]
        };
        for (var i in a) {
            reactivejs.set(a, i, a[i]);
        }
    });

    it("Re-set a property", function () {
        var b = {};
        reactivejs.set(a, 'd', 3);
        reactivejs.setByRef(b, 'c', a, 'd');

        b.c = 1;
        expect(a.d).toEqual(1);

        reactivejs.set(a, 'd', 5);
        expect(b.c).toEqual(5);
    });

    it("Re-setByRef a property", function () {
        var b = {};
        reactivejs.set(a, 'd', 3);
        reactivejs.setByRef(b, 'c', a, 'd');

        b.c = 1;
        expect(a.d).toEqual(1);

        reactivejs.setByRef(b, 'c', a, 'd');
        a.d = 7;
        expect(b.c).toEqual(7);
    });

    it("Set new property by operator =", function () {
        var b = {};
        // If b.c is set to a.b through operator =, re-assign b.c will not affect a.b
        b.c = a.b;
        b.c = 1;
        expect(b.c).not.toEqual(a.b);
    });

    it('Set by reference on non-reactive property', function () {
        var b = {};
        a.d = 3;

        expect(function () {
            reactivejs.setByRef(b, 'c', a, 'd');
        }).toThrow('Property "d" of source object is not reactive');
    });

    it("Set object to object (diff props)", function () {
        var inWatch = '';
        reactivejs.watch(a.b, 'f', function (o, n) {
            inWatch += JSON.stringify(o) + '|' + JSON.stringify(n);
        });
        a.b.f = {
            aa: 1
        };
        expect(inWatch).toEqual('{"h":"aaa"}|{"aa":1}');
    });

    it("Set object to object (has same props)", function () {
        var inWatch = '';
        reactivejs.watch(a.b, 'f', function (o, n) {
            inWatch += JSON.stringify(o) + '|' + JSON.stringify(n);
        });
        a.b.f = {
            h: "3a",
            aa: 1
        };
        expect(inWatch).toEqual('{"h":"aaa"}|{"h":"3a","aa":1}');
    });


    it("Set array to array", function () {
        var inWatch = '';
        reactivejs.watch(a.b, 'g', function (o, n) {
            inWatch += o + '|' + n;
        });
        a.b.g = [1, 2, 3];
        expect(inWatch).toEqual('4,5|1,2,3');
    });

});

// external reference
fdescribe("Reactive suite 3:", function () {
    var a;
    beforeEach(function () {
        a = {
            a: 1,
            b: {
                c: 2,
                d: 3,
                f: {
                    h: 'aaa'
                },
                g: [4, 5]
            },
            c: [1, 2, 3]
        };
        for (var i in a) {
            reactivejs.set(a, i, a[i]);
        }
    });

    it("A var pointing to reactive primitive, then change primitive to primitive", function () {
        var b = a.a;
        a.a = 2;
        expect(b).toEqual(1);
    });

    it("A var pointing to reactive primitive, then change primitive to object", function () {
        var b = a.a;
        a.a = {
            a: 2
        };
        expect(b).toEqual(1);
    });

    it("A var pointing to reactive primitive, then change primitive to array", function () {
        var b = a.a;
        a.a = [1, 2];
        expect(b).toEqual(1);
    });

    it("Define a var pointing to reactive object, then change object to object", function () {
        var b = a.b.f;
        a.b.f = {
            i: "bbb"
        };
        expect(b).toEqual({
            h: "aaa"
        });
    });

    it("Define a var pointing to reactive object, then change object to primitive", function () {
        var b = a.b.f;
        a.b.f = 2;
        expect(b).toEqual({
            h: "aaa"
        });
    });

    it("Define a var pointing to reactive object, then change object to array", function () {
        var b = a.b.f;
        a.b.f = [1, 2];
        expect(b).toEqual({
            h: "aaa"
        });
    });

    it("Define a var pointing to reactive array, then change array to array", function () {
        var b = a.b.g;
        a.b.g = [1, 2, 3];
        expect(b).toEqual([4, 5]);
    });

    it("Define a var pointing to reactive array, then change array to primitive", function () {
        var b = a.b.g;
        a.b.g = 1;
        expect(b).toEqual([4, 5]);
    });

    it("Define a var pointing to reactive array, then change array to object", function () {
        var b = a.b.g;
        a.b.g = {c: 3};
        expect(b).toEqual([4, 5]);
    });

});