var baseAddr = Module.findBaseAddress('gtutorial-x86_64.exe');
console.log('gtutorial-x86_64.exe baseAddr: ' + baseAddr);

// Step 1
const tgame1_keyhandler_relative = 0x3D090;
const tgame1_gametick_relative = 0x3D4B0;

var tgame1_keyhandler = baseAddr.add(tgame1_keyhandler_relative);
var tgame1_gametick = baseAddr.add(tgame1_gametick_relative);

Interceptor.attach(tgame1_keyhandler, {

    // When function is called, print out its parameters
    onEnter: function (args) {

        this.game_ctx = args[0];
    },

    // When function is finished
    onLeave: function (retval) {

        // overwrite shotsfired
        const shotsfired_ptr = this.game_ctx.add(0x6C);
        shotsfired_ptr.writeS32(0);
    }
});

// Step 2
const tgame2_keyhandler_relative = 0x3DE40;
const tgame2_gametick_relative = 0x3D4B0;

var tgame2_keyhandler = baseAddr.add(tgame2_keyhandler_relative);
var tgame2_gametick = baseAddr.add(tgame2_gametick_relative);

Interceptor.attach(tgame2_keyhandler, {

    onEnter: function (args) {

        this.game_ctx = args[0];
    },

    // When function is finished
    onLeave: function (retval) {

        for (let i = 0; i < 100; i++) {
            let bullet = tgame2_getbullet(this.game_ctx, i);
            if (bullet.isNull()) {
                continue;
            }

            let damage = bullet.add(0x70);
            try {
                const damage_amout = damage.readS32();
                if (damage_amout == 1) {
                    // modify player damage
                    damage.writeS32(1000);
                } else if (damage_amout == 2) {
                    // enemy bullet damage
                    damage.writeS32(0);
                }
            } catch (e) {
                // sometimes its not zero :|
            }
        }
    }
});

function tgame2_getbullet(ctx, index) {
    let bullet_arrays = ctx.add(0x40).readPointer();
    if (bullet_arrays.isNull()) {
        return bullet_arrays;
    }
    let bullet = bullet_arrays.add(index * 8).readPointer();
    return bullet;
}

// Step 3
const tgame3_keyhandler_relative = 0x3DE40;
const tgame3_gametick_relative = 0x40E70;

var tgame3_keyhandler = baseAddr.add(tgame3_keyhandler_relative);
var tgame3_gametick = baseAddr.add(tgame3_gametick_relative);

Interceptor.attach(tgame3_gametick, {

    onEnter: function (args) {

        this.game_ctx = args[0];
        if (this.game_ctx.add(0x7C).readU8() == 1) {
            return;
        }

        let player = new TPlatformPlayer(this.game_ctx.add(0x28).readPointer());
        //console.log("(x,y): ", player.x, player.y);

        let platforms = this.game_ctx.add(0x30).readPointer();
        let platforms_length = 0;
        if (!platforms.isNull()) {
            platforms_length = platforms.sub(0x8).readS64();
        }

        for (let i = 0; i < (platforms_length + 1); i++) {
            let platform = new TgameCube(platforms.add(i * 8).readPointer());
            if (platform.color_g == 0) {
                player.x = platform.x;
                player.y = platform.y - (platform.height * 3);
                return;
            }
        }

        // warp to door
        player.x = 0.97;
        player.y = 0.87;
    },

    // When function is finished
    onLeave: function (retval) {

    }
});

class TPlatformPlayer {
    constructor(ptr) {
        this.ptr = ptr;
    }
    get x() {
        return this.ptr.add(0x24).readFloat();
    }
    get y() {
        return this.ptr.add(0x28).readFloat();
    }
    set x(value) {
        this.ptr.add(0x24).writeFloat(value);
    }
    set y(value) {
        this.ptr.add(0x28).writeFloat(value);
    }
}
class TgameCube {
    constructor(ptr) {
        this.ptr = ptr;
    }
    get x() {
        return this.ptr.add(0x24).readFloat();
    }
    get y() {
        return this.ptr.add(0x28).readFloat();
    }
    get height() {
        return this.ptr.add(0x64).readFloat();
    }
    get width() {
        return this.ptr.add(0x60).readFloat();
    }
    get color_g() {
        return this.ptr.add(0x6C).readFloat(); 
    }
}