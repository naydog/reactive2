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