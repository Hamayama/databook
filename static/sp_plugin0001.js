// ****************************************
//                プラグイン
// ****************************************

// ***** Plugin0001(名前空間) *****
//
// 公開I/F :
//
//   Plugin0001.init()  初期化
//
// その他 情報等 :
//
//   インタープリターに命令を追加するプラグインです。
//   Interpreter(名前空間)が先に初期化されている必要があります。
//
//   新しい命令の追加は、
//     make_addfunc_tbl_A()  (戻り値のない関数のとき)
//     make_addfunc_tbl_B()  (戻り値のある関数のとき)
//   の中で行うことを想定しています。
//
//   外部クラス一覧
//     SandSim          砂シミュレート用クラス
//
var Plugin0001;
(function (Plugin0001) {
    var sand_obj = {}; // 砂シミュレート用(SandSimクラスのインスタンス)

    // ***** インタープリター参照用 *****
    // (必要に応じてインタープリターの内部情報を参照する)
    var add_before_run_funcs = Interpreter.add_before_run_funcs;
    var add_after_run_funcs = Interpreter.add_after_run_funcs;
    var add_clear_var_funcs = Interpreter.add_clear_var_funcs;
    var make_one_addfunc_tbl_A = Interpreter.make_one_addfunc_tbl_A;
    var make_one_addfunc_tbl_B = Interpreter.make_one_addfunc_tbl_B;
    var match = Interpreter.match;
    var expression = Interpreter.expression;
    var getvarname = Interpreter.getvarname;
    var get_symbol = Interpreter.get_symbol;
    var get_vars = Interpreter.get_vars;
    var get_ctx = Interpreter.get_ctx;
    var get_can = Interpreter.get_can;
    var set_canvas_axis = Interpreter.set_canvas_axis;
    var set_loop_nocount_flag = Interpreter.set_loop_nocount_flag;
    var get_max_array_size = Interpreter.get_max_array_size;

    // ***** 初期化 *****
    function init() {
        // ***** 実行前処理を登録 *****
        add_before_run_funcs("plugin0001", function () {
            sand_obj = null;
        });
        // ***** 実行後処理を登録 *****
        add_after_run_funcs("plugin0001", function () {
        });
        // ***** 全変数クリア時処理を登録 *****
        add_clear_var_funcs("plugin0001", function () {
        });
        // ***** 追加命令の定義情報の生成 *****
        make_addfunc_tbl_A();
        make_addfunc_tbl_B();
    }
    Plugin0001.init = init;


    // ***** 追加命令(戻り値のない関数)の定義情報の生成 *****
    function make_addfunc_tbl_A() {
        // ***** 砂シミュレート用命令の追加 *****
        make_one_addfunc_tbl_A("sandmake", function () {
            var a1, a2, a3, a4;
            var x1, y1;
            var w1, h1;
            var col, threshold, border_mode;
            var can = get_can();
            var ctx = get_ctx();

            match("("); x1 = parseInt(expression(), 10);
            match(","); y1 = parseInt(expression(), 10);
            match(","); w1 = parseInt(expression(), 10);
            match(","); h1 = parseInt(expression(), 10);
            match(","); a1 = parseFloat(expression());
            match(","); a2 = parseFloat(expression());
            match(","); a3 = parseFloat(expression());
            match(","); a4 = parseFloat(expression());
            match(","); col = parseInt(expression(), 10);
            match(","); threshold = parseInt(expression(), 10);
            // if (symbol[pc] == ")") {
            if (get_symbol() == ")") {
                border_mode = 1;
            } else {
                match(","); border_mode = parseInt(expression(), 10);
            }
            match(")");
            sand_obj = new SandSim(can, ctx, x1, y1, w1, h1, a1, a2, a3, a4, col, threshold, border_mode);
            sand_obj.maketable();
            // loop_nocount_flag = true;
            set_loop_nocount_flag();
            return true;
        });
        make_one_addfunc_tbl_A("sandmove", function () {
            match("(");
            match(")");
            if (sand_obj) { sand_obj.move(); }
            return true;
        });
        make_one_addfunc_tbl_A("sanddraw", function () {
            var ctx = get_ctx();

            match("(");
            match(")");
            if (sand_obj) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                sand_obj.draw();
                set_canvas_axis(ctx);                    // 座標系を再設定
            }
            return true;
        });
        // ***** 上から見たピラミッド(四角すい)を表示する命令の追加 *****
        make_one_addfunc_tbl_A("drawpyramid", function () {
            var a1, a2, a3, a4;
            var x1, y1, x2, y2, ox, oy;
            var alpha_old;
            var ctx = get_ctx();

            match("("); a1 = parseFloat(expression()); // X
            match(","); a2 = parseFloat(expression()); // Y
            match(","); a3 = parseFloat(expression()); // W
            match(","); a4 = parseFloat(expression()); // H
            match(")");
            // ***** 座標の取得 *****
            x1 = a1;
            y1 = a2;
            x2 = a1 + a3;
            y2 = a2 + a4;
            ox = a1 + a3 / 2;
            oy = a2 + a4 / 2;
            // ***** 描画処理 *****
            alpha_old = ctx.globalAlpha;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(ox, oy);
            ctx.lineTo(x1, y2);
            ctx.closePath();
            ctx.globalAlpha = 1.0;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.lineTo(ox, oy);
            ctx.closePath();
            // ctx.globalAlpha = 0.75;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x1, y2);
            ctx.lineTo(ox, oy);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x2, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(ox, oy);
            ctx.closePath();
            ctx.globalAlpha = 0.25;
            ctx.fill();
            ctx.globalAlpha = alpha_old;
            return true;
        });
        // ***** 文字列配列の内容を一括置換する命令の追加 *****
        make_one_addfunc_tbl_A("txtreplace", function () {
            var a1, a2, a3, a4, a5;
            var i;
            var st1, st2;
            var src_str;
            var rep_str;
            var reg_exp;
            var vars = get_vars();
            var max_array_size = get_max_array_size();

            match("(");
            a1 = getvarname();
            match(","); a2 = parseInt(expression(), 10);
            match(","); a3 = parseInt(expression(), 10);
            match(","); a4 = String(expression());
            match(","); a5 = String(expression());
            match(")");

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            if (a4.length == 0) { return true; }
            if (a5.length > a4.length){
                a5 = a5.substring(0, a4.length);
            } else if (a5.length < a4.length) {
                for (i = a5.length; i < a4.length; i++) {
                    a5 = a5 + " ";
                }
            }

            // ***** 置換処理 *****
            // src_str = a4.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"); // 特殊文字の無効化
            src_str = a4.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1"); // 特殊文字の無効化
            rep_str = a5.replace(/\$/g, "$$$$"); // 特殊文字の無効化2
            reg_exp = new RegExp(src_str, "g");
            for (i = a2; i <= a3; i++) {
                // st1 = vars[a1 + "[" + i + "]"];
                st1 = vars.getVarValue(a1 + "[" + i + "]");
                st2 = st1.replace(reg_exp, rep_str);
                // vars[a1 + "[" + i + "]"] = st2;
                vars.setVarValue(a1 + "[" + i + "]", st2);
            }
            return true;
        });
        // ***** 文字列配列の内容を一括置換する命令の追加2 *****
        make_one_addfunc_tbl_A("txtreplace2", function () {
            var a1, a2, a3, a4, a5;
            var i;
            var st1, st2;
            var src_str;
            var reg_exp;
            var ch_tbl;
            var vars = get_vars();
            var max_array_size = get_max_array_size();

            match("(");
            a1 = getvarname();
            match(","); a2 = parseInt(expression(), 10);
            match(","); a3 = parseInt(expression(), 10);
            match(","); a4 = String(expression());
            match(","); a5 = String(expression());
            match(")");

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            if (a4.length == 0) { return true; }
            if (a5.length > a4.length){
                a5 = a5.substring(0, a4.length);
            } else if (a5.length < a4.length) {
                for (i = a5.length; i < a4.length; i++) {
                    a5 = a5 + " ";
                }
            }

            // ***** 置換処理 *****
            // src_str = a4.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"); // 特殊文字の無効化
            src_str = a4.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1"); // 特殊文字の無効化
            reg_exp = new RegExp("[" + src_str + "]", "g");
            ch_tbl = {};
            for (i = 0; i < a4.length; i++) {
                ch_tbl[a4.charAt(i)] = a5.charAt(i);
            }
            for (i = a2; i <= a3; i++) {
                // st1 = vars[a1 + "[" + i + "]"];
                st1 = vars.getVarValue(a1 + "[" + i + "]");
                st2 = st1.replace(reg_exp, function (c) { return ch_tbl[c]; });
                // vars[a1 + "[" + i + "]"] = st2;
                vars.setVarValue(a1 + "[" + i + "]", st2);
            }
            return true;
        });
    }


    // ***** 追加命令(戻り値のある関数)の定義情報の生成 *****
    function make_addfunc_tbl_B() {
        // ***** フラクタル計算用命令の追加 *****
        make_one_addfunc_tbl_B("calcfractal", function () {
            var num;
            var x1, y1;
            var dr, di, mr, mi, cr, ci, tr, ti, zr, zi, rep, norm2;

            match("("); x1 = parseFloat(expression());
            match(","); y1 = parseFloat(expression());
            match(","); dr = parseFloat(expression());
            match(","); di = parseFloat(expression());
            match(","); mr = parseFloat(expression());
            match(","); mi = parseFloat(expression());
            match(","); cr = parseFloat(expression());
            match(","); ci = parseFloat(expression());
            // if (symbol[pc] == ")") {
            if (get_symbol() == ")") {
                rep = 50;
                norm2 = 4;
            } else {
                match(","); rep = parseInt(expression(), 10);
                // if (symbol[pc] == ")") {
                if (get_symbol() == ")") {
                    norm2 = 4;
                } else {
                    match(","); norm2 = parseFloat(expression());
                }
            }
            match(")");

            // ***** エラーチェック *****
            if (rep > 1000) { rep = 1000; }

            tr = x1 * dr + mr;
            ti = y1 * di + mi;
            for (num = 0; num < rep; num++) {
                zr = tr * tr - ti * ti + cr;
                zi = 2 * tr * ti       + ci;
                if (zr * zr + zi * zi > norm2) { break; }
                tr = zr;
                ti = zi;
            }
            return num;
        });
        // ***** 数値の文字列を加算して文字列で返す命令の追加 *****
        // (例. y=intstradd("100","200")  を実行すると y="300"  となる)
        // (例. y=intstradd("100","-200") を実行すると y="-100" となる)
        make_one_addfunc_tbl_B("intstradd", function () {
            var num;
            var a1, a2;
            var reg_exp;
            var ret;
            var i;
            var x_sign, y_sign, z_sign;
            var x_str, y_str, z_str;
            var x_digit = [];
            var y_digit = [];
            var z_digit = [];
            var z_digit_len;
            var x_diginum, y_diginum;

            match("("); a1 = String(expression()); // 数値の文字列1
            match(","); a2 = String(expression()); // 数値の文字列2
            match(")");

            // ***** 数値を各桁に分解する *****
            reg_exp = /^([+\-]?)(\d*)/;
            ret = reg_exp.exec(a1);
            if (ret) {
                if (ret[1]) { x_sign = ret[1]; } else { x_sign = "+"; }
                if (ret[2]) { x_str = ret[2]; } else { x_str = "0"; }
            } else { x_sign = "+"; x_str = "0"; }
            x_digit = x_str.split("").reverse();
            ret = reg_exp.exec(a2);
            if (ret) {
                if (ret[1]) { y_sign = ret[1]; } else { y_sign = "+"; }
                if (ret[2]) { y_str = ret[2]; } else { y_str = "0"; }
            } else { y_sign = "+"; y_str = "0"; }
            y_digit = y_str.split("").reverse();
            // ***** 各桁を加算する *****
            if (x_digit.length >= y_digit.length) {
                z_digit_len = x_digit.length + 1;
            } else {
                z_digit_len = y_digit.length + 1;
            }
            for (i = 0; i < z_digit_len; i++) {
                if (i < x_digit.length) {
                    x_diginum = parseInt(x_sign + x_digit[i], 10);
                } else {
                    x_diginum = 0;
                }
                if (i < y_digit.length) {
                    y_diginum = parseInt(y_sign + y_digit[i], 10);
                } else {
                    y_diginum = 0;
                }
                z_digit[i] = x_diginum + y_diginum;
            }
            // ***** 各桁の桁あふれを処理する *****
            for (i = 0; i < z_digit_len - 1; i++) {
                if (z_digit[i] >= 10) {
                    z_digit[i] = z_digit[i] - 10;
                    z_digit[i + 1] = z_digit[i + 1] + 1;
                } else if (z_digit[i] <= -10) {
                    z_digit[i] = z_digit[i] + 10;
                    z_digit[i + 1] = z_digit[i + 1] - 1;
                }
            }
            // ***** 結果の符号を求める *****
            z_sign = "+";
            for (i = z_digit_len - 1; i >= 0; i--) {
                if (z_digit[i] < 0) { z_sign = "-"; break; }
                if (z_digit[i] > 0) { z_sign = "+"; break; }
            }
            // ***** 各桁の符号を合わせる *****
            if (z_sign == "+") {
                for (i = 0; i < z_digit_len - 1; i++) {
                    if (z_digit[i] < 0) {
                        z_digit[i] = z_digit[i] + 10;
                        z_digit[i + 1] = z_digit[i + 1] - 1;
                    }
                }
            } else {
                for (i = 0; i < z_digit_len - 1; i++) {
                    if (z_digit[i] > 0) {
                        z_digit[i] = z_digit[i] - 10;
                        z_digit[i + 1] = z_digit[i + 1] + 1;
                    }
                }
            }
            // ***** 文字列に変換して返す *****
            for (i = 0; i < z_digit_len; i++) {
                z_digit[i] = String(Math.abs(z_digit[i]) | 0);
            }
            z_str = z_digit.reverse().join("");
            reg_exp = /^0*([1-9]\d*)/;
            ret = reg_exp.exec(z_str);
            if (ret && ret[1]) { z_str = ret[1]; } else { z_str = "0"; }
            if (z_sign == "-") {
                num = z_sign + z_str;
            } else {
                num = z_str;
            }
            return num;
        });
    }


})(Plugin0001 || (Plugin0001 = {}));


// ***** 砂シミュレート用クラス *****
var SandSim = (function () {
    // ***** コンストラクタ *****
    function SandSim(can, ctx, left, top, width, height,
        r_up, r_down, r_left, r_right, sand_col, threshold, border_mode) {
        this.can = can;             // Canvas要素
        this.ctx = ctx;             // Canvasのコンテキスト
        this.left = left;           // シミュレート領域の左上X座標(px)
        this.top = top;             // シミュレート領域の左上Y座標(px)
        this.width = width;         // シミュレート領域の幅(px)
        this.height = height;       // シミュレート領域の高さ(px)
        this.r_up = r_up;           // 上方向の移動確率
        this.r_down = r_down;       // 下方向の移動確率
        this.r_left = r_left;       // 左方向の移動確率
        this.r_right = r_right;     // 右方向の移動確率
        this.sand_col = {};                            // 砂の色(オブジェクト)
        this.sand_col.r = (sand_col & 0xff0000) >> 16; // 砂の色 R
        this.sand_col.g = (sand_col & 0x00ff00) >> 8;  // 砂の色 G
        this.sand_col.b = (sand_col & 0x0000ff);       // 砂の色 B
        this.sand_col.a = 0;                           // 砂の色 alpha
        this.threshold = threshold; // 同色と判定するしきい値(0-255)
        this.sand_buf = [];         // 砂バッファ(配列)
        this.img_buf = [];          // 画像バッファ(配列)
        // ***** 範囲チェック *****
        if (this.left < 0)    { this.left = 0; }
        if (this.top < 0)     { this.top = 0; }
        if (this.width <= 0)  { this.width = 1; }
        if (this.height <= 0) { this.height = 1; }
        if (this.left >= this.can.width) { this.left = this.can.width - 1; }
        if (this.top >= this.can.height) { this.top = this.can.height - 1; }
        if (this.left + this.width > this.can.width)  { this.width = this.can.width - this.left; }
        if (this.top + this.height > this.can.height) { this.height = this.can.height - this.top; }
        // ***** 端を超えて移動するかの設定 *****
        this.over_top    = (border_mode & 1)? this.height - 1: 0;
        this.over_bottom = (border_mode & 1)? 0: this.height - 1;
        this.over_left   = (border_mode & 2)? this.width - 1: 0;
        this.over_right  = (border_mode & 2)? 0: this.width - 1;
    }
    // ***** テーブル生成 *****
    SandSim.prototype.maketable = function () {
        var i, j, k;
        var r, g, b, a, diff2, col2;
        var img_data;
        var sand = {};
        var sand_buf_len;

        // ***** 画像データを取得 *****
        img_data = this.ctx.getImageData(this.left, this.top, this.width, this.height);
        // ***** テーブル生成 *****
        this.sand_buf = [];
        this.img_buf = [];
        for (i = 0; i < this.height; i++) {
            for (j = 0; j < this.width; j++) {
                // ***** 色を取得 *****
                r = img_data.data[(j + i * this.width) * 4];
                g = img_data.data[(j + i * this.width) * 4 + 1];
                b = img_data.data[(j + i * this.width) * 4 + 2];
                // a = img_data.data[(j + i * this.width) * 4 + 3];
                a = 0;
                // ***** 砂の色ならば砂バッファに登録 *****
                diff2 = (this.sand_col.r - r) * (this.sand_col.r - r) +
                        (this.sand_col.g - g) * (this.sand_col.g - g) +
                        (this.sand_col.b - b) * (this.sand_col.b - b) +
                        (this.sand_col.a - a) * (this.sand_col.a - a);
                // if (diff2 <= this.threshold * this.threshold * 4) { // 4倍してスケールを合わせる
                if (diff2 <= this.threshold * this.threshold * 3) { // aは無効なので、3倍してスケールを合わせる
                    sand = {};
                    sand.x = j;
                    sand.y = i;
                    this.sand_buf.push(sand);
                }
                // ***** 色があれば画像バッファに登録 *****
                col2 = r * r + g * g + b * b + a * a;
                // if (col2 > this.threshold * this.threshold * 4) {   // 4倍してスケールを合わせる
                if (col2 > this.threshold * this.threshold * 3) {   // aは無効なので、3倍してスケールを合わせる
                    this.img_buf[j + i * this.width] = 1;
                } else {
                    this.img_buf[j + i * this.width] = 0;
                }
            }
        }
        // ***** テーブルのシャッフル(動きの偏りをなくすため) *****
        sand_buf_len = this.sand_buf.length;
        for (i = 0; i < sand_buf_len; i++) {
            j = Math.random() * sand_buf_len | 0;
            k = Math.random() * sand_buf_len | 0;
            sand = this.sand_buf[j];
            this.sand_buf[j] = this.sand_buf[k];
            this.sand_buf[k] = sand;
        }
    };
    // ***** 移動 *****
    SandSim.prototype.move = function () {
        var i, j;
        var x, y;
        var rp = [];
        var rk = [];
        var rnum, radd, rnd;
        var sand_buf_len;

        // ***** 砂をすべて移動 *****
        sand_buf_len = this.sand_buf.length;
        for (i = 0; i < sand_buf_len; i++) {
            rnum = 0;
            radd = 0;
            // ***** 上方向のチェック *****
            x = this.sand_buf[i].x;
            y = this.sand_buf[i].y - 1;
            if (y < 0) { y = this.over_top; }
            if (this.img_buf[x + y * this.width] == 0) {
                radd += this.r_up;
                rp[rnum] = radd;
                rk[rnum] = 0;
                rnum++;
            }
            // ***** 下方向のチェック *****
            // x = this.sand_buf[i].x;
            y = this.sand_buf[i].y + 1;
            if (y >= this.height) { y = this.over_bottom; }
            if (this.img_buf[x + y * this.width] == 0) {
                radd += this.r_down;
                rp[rnum] = radd;
                rk[rnum] = 1;
                rnum++;
            }
            // ***** 左方向のチェック *****
            x = this.sand_buf[i].x - 1;
            y = this.sand_buf[i].y;
            if (x < 0) { x = this.over_left; }
            if (this.img_buf[x + y * this.width] == 0) {
                radd += this.r_left;
                rp[rnum] = radd;
                rk[rnum] = 2;
                rnum++;
            }
            // ***** 右方向のチェック *****
            x = this.sand_buf[i].x + 1;
            // y = this.sand_buf[i].y;
            if (x >= this.width) { x = this.over_right; }
            if (this.img_buf[x + y * this.width] == 0) {
                radd += this.r_right;
                rp[rnum] = radd;
                rk[rnum] = 3;
                rnum++;
            }
            // ***** 確率によって移動 *****
            rnd = Math.random() * radd;
            for (j = 0; j < rnum; j++) {
                if (rnd < rp[j]) {
                    this.img_buf[this.sand_buf[i].x + this.sand_buf[i].y * this.width] = 0;
                    if (rk[j] == 0) {
                        this.sand_buf[i].y--;
                        if (this.sand_buf[i].y < 0)            { this.sand_buf[i].y = this.over_top; }
                    }
                    if (rk[j] == 1) {
                        this.sand_buf[i].y++;
                        if (this.sand_buf[i].y >= this.height) { this.sand_buf[i].y = this.over_bottom; }
                    }
                    if (rk[j] == 2) {
                        this.sand_buf[i].x--;
                        if (this.sand_buf[i].x < 0)            { this.sand_buf[i].x = this.over_left; }
                    }
                    if (rk[j] == 3) {
                        this.sand_buf[i].x++;
                        if (this.sand_buf[i].x >= this.width)  { this.sand_buf[i].x = this.over_right; }
                    }
                    this.img_buf[this.sand_buf[i].x + this.sand_buf[i].y * this.width] = 1;
                    break;
                }
            }
        }
    };
    // ***** 描画 *****
    SandSim.prototype.draw = function () {
        var i;
        var sand_buf_len;

        // ***** 砂をすべて描画 *****
        sand_buf_len = this.sand_buf.length;
        for (i = 0; i < sand_buf_len; i++) {
            this.ctx.fillRect(this.left + this.sand_buf[i].x, this.top + this.sand_buf[i].y, 1, 1);
        }
    };
    return SandSim; // これがないとクラスが動かないので注意
})();


