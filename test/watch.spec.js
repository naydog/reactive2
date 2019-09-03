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
        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += 'a.aa ' + n;
        });
        a.aa = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on direct reference", function () {
        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += 'a.aa ' + n;
        });
        b.bb = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on indirect reference", function () {
        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += 'a.aa ' + n;
        });
        c.cc = 2;
        expect(inWatch).toEqual('a.aa 2');
    });

    it("Watch on reference on other branch", function () {
        reactivejs.watch(b, 'bb', function(o, n) {
            inWatch += 'b.bb ' + n;
        });
        f.ff = 2;
        expect(inWatch).toEqual('b.bb 2');
    });

    it("Watch twice", function() {
        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += ' a1 ' + n;
        });

        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += ' a2 ' + n;
        });
        a.aa = 2;
        expect(inWatch).toEqual(' a2 2');
    })
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

        reactivejs.watch(a, 'aa', function(o, n) {
            inWatch += 'a ' + n + ',';
        });
        
        reactivejs.watch(b, 'bb', function(o, n) {
            inWatch += 'b ' + n + ',';
        });
        
        reactivejs.watch(c, 'cc', function(o, n) {
            inWatch += 'c ' + n + ',';
        });
        
        reactivejs.watch(d, 'dd', function(o, n) {
            inWatch += 'd ' + n + ',';
        });
        
        reactivejs.watch(e, 'ee', function(o, n) {
            inWatch += 'e ' + n + ',';
        });
        
        reactivejs.watch(f, 'ff', function(o, n) {
            inWatch += 'f ' + n + ',';
        });

        inWatch = '';
    });

    it("Watch a", function () {
        a.aa = 2;
        expect(inWatch).toEqual('a 2,b 2,c 2,d 2,e 2,f 2,');
    });
});