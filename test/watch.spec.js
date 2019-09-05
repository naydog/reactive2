describe("Watch suite:", function () {
    var a, b, c, d, e, f, inWatch;
    beforeEach(function () {
        /*
                  c.cc
                 /    
             b.bb
            /    \
        a.aa      d.dd
            \
             e.ee
                 \
                  f.ff
        */

        a = {}
        reactivejs.set(a, 'aa', 1);

        b = {}
        reactivejs.setByRef(b, 'bb', a, 'aa');

        c = {};
        reactivejs.setByRef(c, 'cc', b, 'bb');

        d = {};
        reactivejs.setByRef(d, 'dd', b, 'bb');

        e = {};
        reactivejs.setByRef(e, 'ee', a, 'aa');

        f = {};
        reactivejs.setByRef(f, 'ff', e, 'ee');

        inWatch = '';
    });

    it("Watch", function () {
        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += 'a.aa ' + n;
        });
        a.aa = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on direct reference", function () {
        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += 'a.aa ' + n;
        });
        b.bb = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on indirect reference", function () {
        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += 'a.aa ' + n;
        });
        c.cc = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on reference on other branch", function () {
        reactivejs.watch(b, 'bb', 'xxx', function (o, n) {
            inWatch += 'b.bb ' + n;
        });
        f.ff = 2;
        expect(inWatch).toEqual('b.bb 2');
    });

    it("Watch override", function () {
        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += ' a1 ' + n;
        });

        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += ' a2 ' + n;
        });
        a.aa = 2;
        expect(inWatch).toEqual(' a2 2');
    });

    it("Different watch name", function () {
        reactivejs.watch(a, 'aa', 'xxx', function (o, n) {
            inWatch += ' a1:' + n;
        });

        reactivejs.watch(a, 'aa', 'yyy', function (o, n) {
            inWatch += ' a2:' + n;
        });
        a.aa = 2;
        expect(inWatch).toEqual(' a1:2 a2:2');
    });

});

describe("Multiple watch suite:", function () {
    var a, b, c, d, e, f, inWatch;
    beforeEach(function () {
        /*
                  c.cc
                 /    
             b.bb
            /    \
        a.aa      d.dd
            \
             e.ee
                 \
                  f.ff
        */

        a = {}
        reactivejs.set(a, 'aa', 1);

        b = {}
        reactivejs.setByRef(b, 'bb', a, 'aa');

        c = {};
        reactivejs.setByRef(c, 'cc', b, 'bb');

        d = {};
        reactivejs.setByRef(d, 'dd', b, 'bb');

        e = {};
        reactivejs.setByRef(e, 'ee', a, 'aa');

        f = {};
        reactivejs.setByRef(f, 'ff', e, 'ee');

        reactivejs.watch(a, 'aa', 'aaa', function (o, n) {
            inWatch += 'a ' + n + ',';
        });

        reactivejs.watch(b, 'bb', 'bbb', function (o, n) {
            inWatch += 'b ' + n + ',';
        });

        reactivejs.watch(c, 'cc', 'ccc', function (o, n) {
            inWatch += 'c ' + n + ',';
        });

        reactivejs.watch(d, 'dd', 'ddd', function (o, n) {
            inWatch += 'd ' + n + ',';
        });

        reactivejs.watch(e, 'ee', 'eee', function (o, n) {
            inWatch += 'e ' + n + ',';
        });

        reactivejs.watch(f, 'ff', 'fff', function (o, n) {
            inWatch += 'f ' + n + ',';
        });

        inWatch = '';
    });

    it("Watch and order", function () {
        a.aa = 2;
        expect(inWatch).toEqual('a 2,b 2,c 2,d 2,e 2,f 2,');
    });

    it("Unwatch", function () {
        reactivejs.unwatch(c, 'cc', 'ccc');
        f.ff = 2;
        expect(inWatch).toEqual('a 2,b 2,d 2,e 2,f 2,');
    });

    it("Unwatch all", function () {
        reactivejs.unwatch(c, 'cc');
        f.ff = 2;
        expect(inWatch).toEqual('');
    });

    it('"this" in watch is pointing to its host', function () {
        var x = {c: 'cc'};
        reactivejs.set(x, 'a', 'aa');

        var y = {d: 'dd'};
        reactivejs.setByRef(y, 'b', x, 'a');
        
        reactivejs.watch(x, 'a', 'x.a', function(o, n) {
            inWatch += this.c + ',' + n + '|';
        });

        reactivejs.watch(y, 'b', 'y.b', function(o, n) {
            inWatch += this.d + ',' + n + '|';
        });

        y.b = 'bb';
        expect(inWatch).toEqual('cc,bb|dd,bb|');
    });
});


// from old version
describe("Watch test suite 1:", function () {
    var a;
    var inWatch;
    beforeEach(function () {
        a = {
            b: {
                c: 2,
                d: 3,
                f: {
                    g: 'aaa'
                },
                g: [4, 5]
            }
        };
        for (var i in a) {
            reactivejs.set(a, i, a[i]);
        }
        inWatch = '';
    });

    it('Watch type change - primitive to object', function () {
        reactivejs.watch(a.b, 'c', 'xxx', function (o, n) {
            inWatch = `${JSON.stringify(o)},${JSON.stringify(n)}`;
        });
        a.b.c = {
            x: 94
        };
        expect(inWatch).toEqual('2,{"x":94}');
    });

    it('Object to primitive', function () {
        reactivejs.watch(a.b, 'f', 'yyy', function (o, n) {
            inWatch = `${JSON.stringify(o)},${JSON.stringify(n)}`;
        });
        a.b.f = 1;
        expect(inWatch).toEqual('{"g":"aaa"},1');
    });

    it('Array to object', function () {
        reactivejs.watch(a.b, 'g', 'xxx', function (o, n) {
            inWatch = JSON.stringify(n);
        });
        a.b.g = {
            c: 3
        };
        expect(inWatch).toEqual('{"c":3}');
    });

    it('Object to array', function () {
        reactivejs.watch(a.b, 'f', 'xxx', function (o, n) {
            inWatch = JSON.stringify(n);
        });
        a.b.f = [7, 8];
        expect(inWatch).toEqual('[7,8]');
    });

    it('Still watches if a property is removed and re-added', function () {
        reactivejs.watch(a.b.f, 'g', function (o, n) {
            inWatch = JSON.stringify(n);
        });
        a.b.f = {};
        a.b.f.g = 4;

        expect(inWatch).toEqual('4');
    });

    it('Watch on a property is removed if the the parent object is removed and re-added', function () {
        reactivejs.watch(a.b.f, 'g', function (o, n) {
            inWatch = JSON.stringify(n);
        });
        a.b.f.g = 5;

        a.b = {}; // update parent
        a.b.f = {
            c: 5
        };
        a.b.f.g = 4;

        expect(inWatch).toEqual('5');
    });

    it('Watch on referenced property', function () {
        reactivejs.watch(a.b.f, 'g', 'eee', function (o, n) {
            inWatch += JSON.stringify(n);
        });

        var b = {};
        reactivejs.setByRef(b, 'c', a.b.f, 'g');
        reactivejs.watch(b, 'c', 'xxx', function (o, n) {
            inWatch += ' b.c';
        });

        a.b.f.g = 5;

        expect(inWatch).toEqual('5 b.c');
    });

    it('"set" a property multiple times causes a watch execute multiple times', function () {
        reactivejs.watch(a.b.f, 'g', function (o, n) {
            inWatch += (inWatch ? '\t' : '') + JSON.stringify(n);
        });
        a.b.f.g = '444';
        expect(inWatch).toEqual('"444"');

        inWatch = '';
        reactivejs.set(a.b.f, 'g', a.b.f.g);
        a.b.f.g = '555';
        expect(inWatch).toEqual('"555"');
    });
});