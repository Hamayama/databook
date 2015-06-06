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
//     add_func_tbl_A()  (戻り値のない関数のとき)
//     add_func_tbl_B()  (戻り値のある関数のとき)
//   の中で行うことを想定しています。
//
//   外部クラス一覧
//     DigitCalc   10進数計算用クラス(staticクラス)
//     ConvZenHan  文字列の全角半角変換用クラス(staticクラス)
//     FloodFill   領域塗りつぶし用クラス
//     Missile     ミサイル用クラス
//     MMLPlayer   MML音楽演奏用クラス
//     SandSim     砂シミュレート用クラス
//
var Plugin0001;
(function (Plugin0001) {
    var stimg = {};     // 画像文字割付用  (連想配列オブジェクト)
    var missile = {};   // ミサイル用      (連想配列オブジェクト)
    var audplayer = {}; // 音楽再生用      (連想配列オブジェクト)
    var sand_obj = {};  // 砂シミュレート用(SandSimクラスのインスタンス)
    var aud_mode;       // 音楽モード      (=0:音楽なし,=1:音楽あり,=2:音楽演奏機能有無による)

    // ***** インタープリター参照用 *****
    // (必要に応じてインタープリターの内部情報を参照する)
    var add_before_run_funcs = Interpreter.add_before_run_funcs;
    var add_after_run_funcs = Interpreter.add_after_run_funcs;
    var add_clear_var_funcs = Interpreter.add_clear_var_funcs;
    var add_one_func_tbl_A = Interpreter.add_one_func_tbl_A;
    var add_one_func_tbl_B = Interpreter.add_one_func_tbl_B;
    var getvarname = Interpreter.getvarname;
    var toglobal = Interpreter.toglobal;
    var set_canvas_axis = Interpreter.set_canvas_axis;
    var conv_axis_point = Interpreter.conv_axis_point;
    var max_array_size = Interpreter.max_array_size;
    var max_str_size = Interpreter.max_str_size;
    var get_imgvars = Interpreter.get_imgvars;
    var get_font_size = Interpreter.get_font_size;
    var set_color_val = Interpreter.set_color_val;
    var set_loop_nocount = Interpreter.set_loop_nocount;

    // ***** hasOwnPropertyをプロパティ名に使うかもしれない場合の対策 *****
    // (変数名、関数名、ラベル名、画像変数名について、
    //  obj.hasOwnProperty(prop) を hasOwn.call(obj, prop) に置換した)
    var hasOwn = Object.prototype.hasOwnProperty;

    // ****************************************
    //                 公開I/F
    // ****************************************

    // ***** 初期化 *****
    function init() {
        // ***** 実行前処理を登録 *****
        add_before_run_funcs("plugin0001", function () {
            stimg = {};
            missile = {};
            audplayer = {};
            sand_obj = null;
            aud_mode = 1;
        });
        // ***** 実行後処理を登録 *****
        add_after_run_funcs("plugin0001", function () {
            // ***** 音楽全停止 *****
            audstopall();
        });
        // ***** 全変数クリア時処理を登録 *****
        add_clear_var_funcs("plugin0001", function () {
            stimg = {};
            missile = {};
            // ***** 音楽全停止 *****
            audstopall();
        });
        // ***** 追加命令の定義情報の生成 *****
        add_func_tbl_A();
        add_func_tbl_B();
    }
    Plugin0001.init = init;


    // ***** 公開I/Fはここまで *****


    // ***** 以下は内部処理用 *****


    // ****************************************
    //            追加命令の定義処理
    // ****************************************

    // ***** 追加の組み込み関数(戻り値なし)の定義情報の生成 *****
    function add_func_tbl_A() {
        // ***** 追加の組み込み関数(戻り値なし)の定義情報を1個ずつ生成 *****
        // (第2引数は関数の引数の数を指定する(ただし省略可能な引数は数に入れない))
        // (第3引数は「変数名をとる引数」がある場合にその引数番号を配列で指定する)
        add_one_func_tbl_A("audmode", 1, [], function (param, vars, can, ctx) {
            var a1;

            a1 = parseInt(param[0], 10);
            aud_mode = a1;
            return true;
        });
        add_one_func_tbl_A("audmake", 2, [], function (param, vars, can, ctx) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            a2 = String(param[1]);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.stop();
                delete audplayer[a1];
            }
            audplayer[a1] = {};
            audplayer[a1].mmlplayer = new MMLPlayer();
            audplayer[a1].mmlplayer.setMML(a2);
            // loop_nocount_flag = true;
            set_loop_nocount();
            return true;
        });
        add_one_func_tbl_A("audmakedata", 2, [], function (param, vars, can, ctx) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            a2 = String(param[1]); // 音楽データ(data URI scheme)

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.stop();
                delete audplayer[a1];
            }
            audplayer[a1] = {};
            audplayer[a1].mmlplayer = new MMLPlayer();
            audplayer[a1].mmlplayer.setAUDData(a2);
            // loop_nocount_flag = true;
            set_loop_nocount();
            return true;
        });
        add_one_func_tbl_A("audplay", 1, [], function (param, vars, can, ctx) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = parseInt(param[1], 10);
            }

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.play(a2);
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            return true;
        });
        add_one_func_tbl_A("audspeedrate", 2, [], function (param, vars, can, ctx) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            a2 = parseFloat(param[1]);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.setSpeedRate(a2);
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            return true;
        });
        add_one_func_tbl_A("audstop", 1, [], function (param, vars, can, ctx) {
            var a1;

            a1 = parseInt(param[0], 10);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.stop();
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            return true;
        });
        add_one_func_tbl_A("audvolume", 2, [], function (param, vars, can, ctx) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            a2 = parseInt(param[1], 10);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1) {
                if (!MMLPlayer.AudioContext) { throw new Error("音楽演奏機能が利用できません。"); }
            } else if (aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return true; }
            } else {
                return true;
            }

            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.setVolume(a2);
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            return true;
        });
        add_one_func_tbl_A("colalpha", 2, [], function (param, vars, can, ctx) {
            var a1, a2;
            var col_r, col_g, col_b, alpha;
            var color_val;

            a1 = parseInt(param[0], 10); // RGB
            a2 = parseInt(param[1], 10); // alpha
            col_r = (a1 & 0xff0000) >> 16; // R
            col_g = (a1 & 0x00ff00) >> 8;  // G
            col_b = (a1 & 0x0000ff);       // B
            alpha = a2 / 255;
            color_val = "rgba(" + col_r + "," + col_g + "," + col_b + "," + alpha + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            set_color_val(color_val);
            return true;
        });
        add_one_func_tbl_A("coloralpha", 4, [], function (param, vars, can, ctx) {
            var a1, a2, a3 ,a4;
            var col_r, col_g, col_b, alpha;
            var color_val;

            a1 = parseInt(param[0], 10); // R
            a2 = parseInt(param[1], 10); // G
            a3 = parseInt(param[2], 10); // B
            a4 = parseInt(param[3], 10); // alpha
            col_r = a1;
            col_g = a2;
            col_b = a3;
            alpha = a4 / 255;
            color_val = "rgba(" + col_r + "," + col_g + "," + col_b + "," + alpha + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            set_color_val(color_val);
            return true;
        });
        add_one_func_tbl_A("disaud", 1, [], function (param, vars, can, ctx) {
            var a1;

            a1 = parseInt(param[0], 10);
            if (audplayer.hasOwnProperty(a1)) {
                audplayer[a1].mmlplayer.stop();
                delete audplayer[a1];
            }
            return true;
        });
        add_one_func_tbl_A("dismis", 1, [], function (param, vars, can, ctx) {
            var a1;

            a1 = parseInt(param[0], 10);
            if (missile.hasOwnProperty(a1)) {
                delete missile[a1];
            }
            // for (var prop_name in missile) { DebugShow(prop_name + " "); } DebugShow("\n");
            return true;
        });
        add_one_func_tbl_A("disstrimg", 1, [], function (param, vars, can, ctx) {
            var a1;
            var ch;

            a1 = String(param[0]);
            ch = a1.charAt(0); // 1文字だけにする
            if (ch.length == 0) { return true; }
            if (stimg.hasOwnProperty(ch)) {
                delete stimg[ch];
            }
            // for (var prop_name in stimg) { DebugShow(prop_name + " "); } DebugShow("\n");
            return true;
        });
        add_one_func_tbl_A("drawshape", 1, [], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5, a6, a7;
            var mode;
            var i;
            var a, b, x0, y0, r1, c1;
            var x1, y1, x2, y2, ox, oy;
            var alpha_old;

            mode = parseInt(param[0], 10); // 図形の種類
            // ***** 図形の種類で場合分け *****
            switch (mode) {
                case 0: // 正多角形(塗りつぶしあり)
                case 1: // 正多角形(塗りつぶしなし)
                    if (param.length < 8) {
                        a1 = 0;
                        a2 = 0;
                        a3 = 100;
                        a4 = 100;
                        a5 = 0;
                        a6 = 120;
                        a7 = 3;
                    } else {
                        a1 = parseFloat(param[1]);   // X
                        a2 = parseFloat(param[2]);   // Y
                        a3 = parseFloat(param[3]);   // W
                        a4 = parseFloat(param[4]);   // H
                        a5 = parseFloat(param[5]);   // 開始角
                        a6 = parseFloat(param[6]);   // 加算角
                        a7 = parseInt(param[7], 10); // 頂点数
                    }
                    // ***** エラーチェック *****
                    if (a7 > 1000) { a7 = 1000; }
                    // ***** 描画処理 *****
                    a = a3 / 2;  // X方向の半径
                    b = a4 / 2;  // Y方向の半径
                    x0 = a1 + a; // 中心のX座標
                    y0 = a2 + b; // 中心のY座標
                    ctx.beginPath();
                    r1 = (a5 - 90) * Math.PI / 180; // 開始角は真上を0とするため90を引く
                    c1 = a6 * Math.PI / 180;
                    ctx.moveTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                    for (i = 1; i < a7; i++) {
                        r1 += c1;
                        ctx.lineTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                    }
                    ctx.closePath();
                    if ((mode % 2) == 0) {
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                    break;
                case 100: // 上から見た四角すい(塗りつぶしあり)
                case 101: // 上から見た四角すい(塗りつぶしなし)
                    if (param.length < 5) {
                        a1 = 0;
                        a2 = 0;
                        a3 = 100;
                        a4 = 100;
                    } else {
                        a1 = parseFloat(param[1]); // X
                        a2 = parseFloat(param[2]); // Y
                        a3 = parseFloat(param[3]); // W
                        a4 = parseFloat(param[4]); // H
                    }
                    // ***** 座標の取得 *****
                    x1 = a1;
                    y1 = a2;
                    x2 = a1 + a3;
                    y2 = a2 + a4;
                    ox = a1 + a3 / 2;
                    oy = a2 + a4 / 2;
                    // ***** 描画処理 *****
                    ctx.beginPath(); // 左側
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(ox, oy);
                    ctx.lineTo(x1, y2);
                    ctx.closePath();
                    if ((mode % 2) == 0) {
                        alpha_old = ctx.globalAlpha;
                        ctx.globalAlpha = 1.0;
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                    ctx.beginPath(); // 上側
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(ox, oy);
                    ctx.closePath();
                    if ((mode % 2) == 0) {
                        // ctx.globalAlpha = 0.75;
                        ctx.globalAlpha = 0.5;
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                    ctx.beginPath(); // 下側
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(ox, oy);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    if ((mode % 2) == 0) {
                        ctx.globalAlpha = 0.5;
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                    ctx.beginPath(); // 右側
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(ox, oy);
                    ctx.closePath();
                    if ((mode % 2) == 0) {
                        ctx.globalAlpha = 0.25;
                        ctx.fill();
                        ctx.globalAlpha = alpha_old;
                    } else {
                        ctx.stroke();
                    }
                    break;
            }
            return true;
        });
        add_one_func_tbl_A("fillarea", 2, [], function (param, vars, can, ctx) {
            var a1, a2;
            var x1, y1;
            var ret_obj = {};
            var col, threshold, paint_mode;
            var ffill_obj = {};

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            if (param.length <= 2) {
                threshold = 0;
                col = 0;
                paint_mode = 0;
            } else {
                threshold = parseInt(param[2], 10); // しきい値
                if (param.length <= 3) {
                    col = 0;
                    paint_mode = 0;
                } else {
                    col = parseInt(param[3], 10); // 境界色 RGB
                    paint_mode = 1;
                }
            }
            // ***** 座標系の変換の分を補正 *****
            ret_obj = {};
            conv_axis_point(a1, a2, ret_obj);
            x1 = ret_obj.x;
            y1 = ret_obj.y;
            // ***** 領域塗りつぶし *****
            ffill_obj = new FloodFill(can, ctx, x1, y1, threshold, paint_mode, col, 255);
            ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
            ffill_obj.fill();  // 塗りつぶし処理
            set_canvas_axis(ctx);                    // 座標系を再設定
            return true;
        });
        add_one_func_tbl_A("fpoly", 4, [0, 1], function (param, vars, can, ctx) {
            var a1, a2, a3;
            var b1;
            var i;
            var x0, y0, x1, y1;

            a1 = getvarname(param[0]);
            b1 = getvarname(param[1]);
            a2 = parseInt(param[2], 10);
            a3 = parseInt(param[3], 10);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            i = a2;

            // // ***** 配列の存在チェック *****
            // if (!vars.checkVar(a1 + "[" + i + "]")) { return true; }
            // if (!vars.checkVar(b1 + "[" + i + "]")) { return true; }

            ctx.beginPath();
            // x0 = parseFloat(vars[a1 + "[" + i + "]"]);
            x0 = parseFloat(vars.getVarValue(a1 + "[" + i + "]"));
            // y0 = parseFloat(vars[b1 + "[" + i + "]"]);
            y0 = parseFloat(vars.getVarValue(b1 + "[" + i + "]"));
            ctx.moveTo(x0, y0);
            for (i = a2 + 1; i <= a3; i++) {

                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }
                // if (!vars.checkVar(b1 + "[" + i + "]")) { break; }

                // x1 = parseFloat(vars[a1 + "[" + i + "]"]);
                x1 = parseFloat(vars.getVarValue(a1 + "[" + i + "]"));
                // y1 = parseFloat(vars[b1 + "[" + i + "]"]);
                y1 = parseFloat(vars.getVarValue(b1 + "[" + i + "]"));
                ctx.lineTo(x1, y1);
            }
            ctx.closePath();
            ctx.fill();
            return true;
        });
        add_one_func_tbl_A("mismake", 13, [1, 2, 3, 4, 5, 6], function (param, vars, can, ctx) {
            var ch;
            var no, useflag, x100, y100, degree, speed100;
            var useflag_var_name, x100_var_name, y100_var_name;
            var degree_var_name, speed100_var_name, ch_var_name;
            var min_x, max_x, min_y, max_y, div_x, div_y;

            no = parseInt(param[0], 10);
            useflag_var_name =  getvarname(param[1]); // 制御用の変数名を取得
            x100_var_name =     getvarname(param[2]); // 制御用の変数名を取得
            y100_var_name =     getvarname(param[3]); // 制御用の変数名を取得
            degree_var_name =   getvarname(param[4]); // 制御用の変数名を取得
            speed100_var_name = getvarname(param[5]); // 制御用の変数名を取得
            ch_var_name =       getvarname(param[6]); // 制御用の変数名を取得
            min_x = parseInt(param[7], 10);
            max_x = parseInt(param[8], 10);
            min_y = parseInt(param[9], 10);
            max_y = parseInt(param[10], 10);
            div_x = parseFloat(param[11]);
            div_y = parseFloat(param[12]);
            // ***** ミサイル作成 *****
            useflag =  parseInt(vars.getVarValue(useflag_var_name),  10);
            x100 =     parseInt(vars.getVarValue(x100_var_name),     10);
            y100 =     parseInt(vars.getVarValue(y100_var_name),     10);
            degree =   parseFloat(vars.getVarValue(degree_var_name));
            speed100 = parseInt(vars.getVarValue(speed100_var_name), 10);
            ch =         String(vars.getVarValue(ch_var_name));
            missile[no] = new Missile(no, useflag, x100, y100, degree, speed100, ch,
                min_x, max_x, min_y, max_y, div_x, div_y,
                useflag_var_name, x100_var_name, y100_var_name,
                degree_var_name, speed100_var_name, ch_var_name);
            return true;
        });
        add_one_func_tbl_A("mismove", 0, [], function (param, vars, can, ctx) {
            var mis, mis_no;
            var range_use, min_no, max_no;

            if (param.length <= 1) {
                range_use = false;
                min_no = 0;
                max_no = 0;
            } else {
                range_use = true;
                min_no = parseInt(param[0], 10);
                max_no = parseInt(param[1], 10);
            }
            // ***** 全ミサイルを移動 *****
            for (mis_no in missile) {
                if (missile.hasOwnProperty(mis_no)) {
                    mis = missile[mis_no];
                    if (range_use == false || (mis.no >= min_no && mis.no <= max_no)) {
                        mis.useflag = parseInt(vars.getVarValue(mis.useflag_var_name), 10);
                        if (mis.useflag != 0) {
                            mis.x100 =     parseInt(vars.getVarValue(mis.x100_var_name),     10);
                            mis.y100 =     parseInt(vars.getVarValue(mis.y100_var_name),     10);
                            mis.degree =   parseFloat(vars.getVarValue(mis.degree_var_name));
                            mis.speed100 = parseInt(vars.getVarValue(mis.speed100_var_name), 10);
                            mis.ch =         String(vars.getVarValue(mis.ch_var_name));
                            mis.move();
                            vars.setVarValue(mis.useflag_var_name,  mis.useflag);
                            vars.setVarValue(mis.x100_var_name,     mis.x100);
                            vars.setVarValue(mis.y100_var_name,     mis.y100);
                            // vars.setVarValue(mis.degree_var_name,   mis.degree);
                            // vars.setVarValue(mis.speed100_var_name, mis.speed100);
                            // vars.setVarValue(mis.ch_var_name,       mis.ch);
                        }
                    }
                }
            }
            return true;
        });
        add_one_func_tbl_A("mistext", 3, [0], function (param, vars, can, ctx) {
            var a1, a2, a3;
            var i;
            var x1, y1;
            var ch, chs, ovr;
            var mis, mis_no;
            var range_use, min_no, max_no;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            if (param.length <= 4) {
                range_use = false;
                min_no = 0;
                max_no = 0;
            } else {
                range_use = true;
                min_no = parseInt(param[3], 10);
                max_no = parseInt(param[4], 10);
            }

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 全ミサイルを描画 *****
            for (mis_no in missile) {
                if (missile.hasOwnProperty(mis_no)) {
                    mis = missile[mis_no];
                    if (range_use == false || (mis.no >= min_no && mis.no <= max_no)) {
                        mis.useflag = parseInt(vars.getVarValue(mis.useflag_var_name), 10);
                        // (有効フラグが0以外で1000以下のときのみ表示)
                        // if (mis.useflag != 0) {
                        if (mis.useflag != 0 && mis.useflag <= 1000) {
                            mis.x100 = parseInt(vars.getVarValue(mis.x100_var_name), 10);
                            mis.y100 = parseInt(vars.getVarValue(mis.y100_var_name), 10);
                            mis.ch =     String(vars.getVarValue(mis.ch_var_name));
                            x1 = (mis.x100 / 100) | 0; // 整数化
                            y1 = (mis.y100 / 100) | 0; // 整数化
                            ch = mis.ch;
                            // (複数行文字列指定のとき)
                            if (ch.length >= 7 && "#$%&".indexOf(ch.charAt(0)) >= 0) {
                                chs = ch.split(ch.charAt(0));
                                x1 = x1 + (chs[1] | 0);
                                y1 = y1 + (chs[2] | 0);
                                ovr = chs[3] | 0;
                                for (i = 4; i < chs.length; i++) {
                                    if (ovr == 1) {
                                        txtovrsub2(vars, a1, a2, a3, x1, y1, chs[i]);
                                    } else if (ovr == 2) {
                                        txtovrsub3(vars, a1, a2, a3, x1, y1, chs[i]);
                                    } else {
                                        txtovrsub(vars, a1, a2, a3, x1, y1, chs[i]);
                                    }
                                    y1++;
                                }
                            } else {
                                // txtpsetsub(vars, a1, a2, a3, x1, y1, ch);
                                txtovrsub(vars, a1, a2, a3, x1, y1, ch);
                            }
                        }
                    }
                }
            }
            return true;
        });
        add_one_func_tbl_A("poly", 4, [0, 1], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var b1;
            var i;
            var x0, y0, x1, y1;

            a1 = getvarname(param[0]);
            b1 = getvarname(param[1]);
            a2 = parseInt(param[2], 10);
            a3 = parseInt(param[3], 10);
            if (param.length <= 4) {
                a4 = 0;
            } else {
                a4 = parseInt(param[4], 10);
            }

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            i = a2;

            // // ***** 配列の存在チェック *****
            // if (!vars.checkVar(a1 + "[" + i + "]")) { return true; }
            // if (!vars.checkVar(b1 + "[" + i + "]")) { return true; }

            ctx.beginPath();
            // x0 = parseFloat(vars[a1 + "[" + i + "]"]);
            x0 = parseFloat(vars.getVarValue(a1 + "[" + i + "]"));
            // y0 = parseFloat(vars[b1 + "[" + i + "]"]);
            y0 = parseFloat(vars.getVarValue(b1 + "[" + i + "]"));
            ctx.moveTo(x0, y0);
            for (i = a2 + 1; i <= a3; i++) {

                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }
                // if (!vars.checkVar(b1 + "[" + i + "]")) { break; }

                // x1 = parseFloat(vars[a1 + "[" + i + "]"]);
                x1 = parseFloat(vars.getVarValue(a1 + "[" + i + "]"));
                // y1 = parseFloat(vars[b1 + "[" + i + "]"]);
                y1 = parseFloat(vars.getVarValue(b1 + "[" + i + "]"));
                ctx.lineTo(x1, y1);
            }
            if (a4 == 0) { ctx.closePath(); }
            ctx.stroke();
            return true;
        });
        add_one_func_tbl_A("sandmake", 10, [], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var x1, y1;
            var w1, h1;
            var col, threshold, border_mode;

            x1 = parseInt(param[0], 10);
            y1 = parseInt(param[1], 10);
            w1 = parseInt(param[2], 10);
            h1 = parseInt(param[3], 10);
            a1 = parseFloat(param[4]);
            a2 = parseFloat(param[5]);
            a3 = parseFloat(param[6]);
            a4 = parseFloat(param[7]);
            col = parseInt(param[8], 10);
            threshold = parseInt(param[9], 10);
            if (param.length <= 10) {
                border_mode = 1;
            } else {
                border_mode = parseInt(param[10], 10);
            }
            sand_obj = new SandSim(can, ctx, x1, y1, w1, h1, a1, a2, a3, a4, col, threshold, border_mode);
            sand_obj.maketable();
            // loop_nocount_flag = true;
            set_loop_nocount();
            return true;
        });
        add_one_func_tbl_A("sandmove", 0, [], function (param, vars, can, ctx) {
            if (sand_obj) { sand_obj.move(); }
            return true;
        });
        add_one_func_tbl_A("sanddraw", 0, [], function (param, vars, can, ctx) {
            if (sand_obj) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                sand_obj.draw();
                set_canvas_axis(ctx);                    // 座標系を再設定
            }
            return true;
        });
        add_one_func_tbl_A("setstrimg", 2, [1], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var ch;
            var imgvars = get_imgvars();

            a1 = String(param[0]);
            a2 = toglobal(getvarname(param[1])); // 画像変数名取得
            if (param.length <= 3) {
                a3 = 0;
                a4 = 0;
            } else {
                a3 = parseInt(param[2], 10);
                a4 = parseInt(param[3], 10);
            }
            // ***** 画像文字割付を格納 *****
            ch = a1.charAt(0); // 1文字だけにする
            if (ch.length == 0) { return true; }
            // if (imgvars.hasOwnProperty(a2)) {
            if (hasOwn.call(imgvars, a2)) {
                stimg[ch] = {};
                stimg[ch].img = imgvars[a2];
                stimg[ch].off_x = a3;
                stimg[ch].off_y = a4;
            } else {
                throw new Error("Image「" + a1 + "」がロードされていません。");
            }
            return true;
        });
        add_one_func_tbl_A("transimg", 2, [0], function (param, vars, can, ctx) {
            var a1, a2;
            var i;
            var col_r, col_g, col_b;
            var img_data = {};
            var imgvars = get_imgvars();

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = parseInt(param[1], 10); // RGB
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                col_r = (a2 & 0xff0000) >> 16; // R
                col_g = (a2 & 0x00ff00) >> 8;  // G
                col_b = (a2 & 0x0000ff);       // B
                // ***** 画像データを取得 *****
                img_data = imgvars[a1].ctx.getImageData(0, 0, imgvars[a1].can.width, imgvars[a1].can.height);
                // ***** 透明画像変換 *****
                for (i = 0; i < img_data.data.length; i += 4) {
                    if (img_data.data[i    ] == col_r &&
                        img_data.data[i + 1] == col_g &&
                        img_data.data[i + 2] == col_b) {
                            img_data.data[i    ] = 0;
                            img_data.data[i + 1] = 0;
                            img_data.data[i + 2] = 0;
                            img_data.data[i + 3] = 0;
                    }
                }
                // ***** 画像を格納 *****
                imgvars[a1].ctx.putImageData(img_data, 0, 0);
            } else {
                throw new Error("Image「" + a1 + "」がロードされていません。");
            }
            return true;
        });
        add_one_func_tbl_A("txtmake", 5, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5;
            var i;
            var st1;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            a4 = String(param[3]);
            a5 = parseInt(param[4], 10);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (a5 > max_str_size) {
            if (!(a5 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }

            // ***** 作成処理 *****
            st1 = strrepeatsub(a4, a5);
            for (i = a2; i <= a3; i++) {
                // vars[a1 + "[" + i + "]"] = st1;
                vars.setVarValue(a1 + "[" + i + "]", st1);
            }
            return true;
        });
        add_one_func_tbl_A("txtdraw", 3, [0], function (param, vars, can, ctx) {
            var a1, a2, a3;
            var x1, y1;
            var i;
            var st1;
            var font_size = get_font_size();

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            if (param.length <= 4) {
                x1 = 0;
                y1 = 0;
            } else {
                x1 = parseInt(param[3], 10);
                y1 = parseInt(param[4], 10);
            }

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            for (i = a2; i <= a3; i++) {

                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }

                // st1 = vars[a1 + "[" + i + "]"];
                st1 = vars.getVarValue(a1 + "[" + i + "]");

                // ***** 文字列に変換 *****
                st1 = String(st1);

                // ***** Chrome v24 で全角スペースが半角のサイズで表示される件の対策 *****
                st1 = st1.replace(/　/g, "  "); // 全角スペースを半角スペース2個に変換

                // ***** 文字列表示 *****
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(st1, x1, y1);
                y1 += font_size;
            }
            return true;
        });
        add_one_func_tbl_A("txtdrawimg", 7, [0], function (param, vars, can, ctx) {
            var a1, a2, a3;
            var x1, y1, x2;
            var w1, h1;
            var i, j;
            var ch;
            var st1;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            w1 = parseInt(param[5], 10);
            h1 = parseInt(param[6], 10);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            for (i = a2; i <= a3; i++) {

                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }

                // st1 = vars[a1 + "[" + i + "]"];
                st1 = vars.getVarValue(a1 + "[" + i + "]");
                st1 = String(st1);
                x2 = x1;
                for (j = 0; j < st1.length; j++) {
                    ch = st1.charAt(j);
                    if (stimg.hasOwnProperty(ch)) {
                        ctx.drawImage(stimg[ch].img.can, x2 + stimg[ch].off_x, y1 + stimg[ch].off_y);
                    }
                    x2 += w1;
                }
                y1 += h1;
            }
            return true;
        });
        add_one_func_tbl_A("txtovr", 8, [0, 5], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var b1, b2, b3;
            var x1, y1;
            var i;
            var i_start, i_end, i_plus;
            var st1, st2;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            b1 = getvarname(param[5]);
            b2 = parseInt(param[6], 10);
            b3 = parseInt(param[7], 10);
            if (param.length <= 8) {
                a4 = 0;
            } else {
                a4 = parseInt(param[8], 10);
            }

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;
            b2 = b2 | 0;
            b3 = b3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (b3 - b2 + 1 < 1 || b3 - b2 + 1 > max_array_size) {
            if (!(b3 - b2 + 1 >= 1 && b3 - b2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            if (a1 == b1 && b2 < y1) {
                // (後から処理)
                i_start = b3;
                i_end = b2;
                i_plus = -1;
                y1 = y1 + (b3 - b2);
            } else {
                // (前から処理)
                i_start = b2;
                i_end = b3;
                i_plus = 1;
            }
            i = i_start;
            while (true) {
                if (y1 >= a2 && y1 <= a3) {

                    // // ***** 配列の存在チェック *****
                    // if (!vars.checkVar(a1 + "[" + y1 + "]")) { break; }
                    // if (!vars.checkVar(b1 + "[" + i + "]")) { break; }

                    // st1 = vars[a1 + "[" + y1 + "]"];
                    st1 = vars.getVarValue(a1 + "[" + y1 + "]");
                    st1 = String(st1);
                    // st2 = vars[b1 + "[" + i + "]"];
                    st2 = vars.getVarValue(b1 + "[" + i + "]");
                    st2 = String(st2);
                    if (a4 == 1) {
                        st1 = strovrsub2(st1, x1, st2);
                    } else if (a4 == 2) {
                        st1 = strovrsub3(st1, x1, st2);
                    } else {
                        st1 = strovrsub(st1, x1, st2);
                    }
                    // vars[a1 + "[" + y1 + "]"] = st1;
                    vars.setVarValue(a1 + "[" + y1 + "]", st1);
                }
                i  += i_plus;
                y1 += i_plus;
                if (i_plus > 0 && i <= i_end) { continue; }
                if (i_plus < 0 && i >= i_end) { continue; }
                break;
            }
            return true;
        });
        add_one_func_tbl_A("txtpset", 6, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var x1, y1;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            a4 = String(param[5]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 描画処理 *****
            // txtpsetsub(vars, a1, a2, a3, x1, y1, a4);
            txtovrsub(vars, a1, a2, a3, x1, y1, a4);
            return true;
        });
        add_one_func_tbl_A("txtline", 8, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var x1, y1, x2, y2;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            x2 = parseInt(param[5], 10);
            y2 = parseInt(param[6], 10);
            a4 = String(param[7]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (x1 > max_str_size || y1 > max_str_size) {
            if (!(x1 <= max_str_size && y1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            // if (x2 > max_str_size || y2 > max_str_size) {
            if (!(x2 <= max_str_size && y2 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }

            // ***** 描画処理 *****
            txtlinesub(vars, a1, a2, a3, x1, y1, x2, y2, a4);
            return true;
        });
        add_one_func_tbl_A("txtbox", 8, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5;
            var x1, y1, x2, y2, x3, y3, x4, y4;
            var i;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            x2 = parseInt(param[5], 10);
            y2 = parseInt(param[6], 10);
            a4 = String(param[7]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (x1 > max_str_size || y1 > max_str_size) {
            if (!(x1 <= max_str_size && y1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            // if (x2 > max_str_size || y2 > max_str_size) {
            if (!(x2 <= max_str_size && y2 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }

            // ***** 描画処理 *****
            if (x1 > x2) { x3 = x2; x4 = x1; } else { x3 = x1; x4 = x2; }
            if (y1 > y2) { y3 = y2; y4 = y1; } else { y3 = y1; y4 = y2; }
            a5 = strrepeatsub(a4, x4 - x3 + 1);
            txtovrsub(vars, a1, a2, a3, x3, y3, a5);
            txtovrsub(vars, a1, a2, a3, x3, y4, a5);
            for (i = y3; i <= y4; i++) {
                txtpsetsub(vars, a1, a2, a3, x3, i, a4);
                txtpsetsub(vars, a1, a2, a3, x4, i, a4);
            }
            return true;
        });
        add_one_func_tbl_A("txtfbox", 8, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5;
            var x1, y1, x2, y2, x3, y3, x4, y4;
            var i;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            x2 = parseInt(param[5], 10);
            y2 = parseInt(param[6], 10);
            a4 = String(param[7]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (x1 > max_str_size || y1 > max_str_size) {
            if (!(x1 <= max_str_size && y1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            // if (x2 > max_str_size || y2 > max_str_size) {
            if (!(x2 <= max_str_size && y2 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }

            // ***** 描画処理 *****
            if (x1 > x2) { x3 = x2; x4 = x1; } else { x3 = x1; x4 = x2; }
            if (y1 > y2) { y3 = y2; y4 = y1; } else { y3 = y1; y4 = y2; }
            a5 = strrepeatsub(a4, x4 - x3 + 1);
            for (i = y3; i <= y4; i++) {
                txtovrsub(vars, a1, a2, a3, x3, i, a5);
            }
            return true;
        });
        add_one_func_tbl_A("txtcircle", 9, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var x1, y1, x2, y2;
            var r1, a, b;
            var rr, aa, bb;
            var drawflag;
            var x_old, y_old;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            r1 = parseInt(param[5], 10);
            a = parseFloat(param[6]);
            b = parseFloat(param[7]);
            a4 = String(param[8]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (r1 > max_str_size) {
            if (!(r1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            if (r1 < 0) { return true; }

            // ***** 描画処理 *****
            if (a < 1) { a = 1; }
            if (b < 1) { b = 1; }
            aa = a * a;
            bb = b * b;
            rr = r1 * r1;
            x2 = r1;
            drawflag = 0;
            x_old = 0;
            y_old = 0;
            for (y2 = 0; y2 <= r1; y2++) {
                // 円の内側になるまでループ
                while (aa * x2 * x2 + bb * y2 * y2 >= rr) {
                    x2--;
                    if (x2 < 0) { break; }
                }
                if (x2 < 0) {
                    if (drawflag == 1) {
                        // 上下の最後の部分を水平線で追加表示
                        txtovrsub(vars, a1, a2, a3, x1 - x_old, y1 - y_old, strrepeatsub(a4, 2 * x_old + 1));
                        txtovrsub(vars, a1, a2, a3, x1 - x_old, y1 + y_old, strrepeatsub(a4, 2 * x_old + 1));
                    }
                    break;
                }
                // 両端の点を表示
                txtpsetsub(vars, a1, a2, a3, x1 - x2, y1 - y2, a4);
                txtpsetsub(vars, a1, a2, a3, x1 + x2, y1 - y2, a4);
                txtpsetsub(vars, a1, a2, a3, x1 - x2, y1 + y2, a4);
                txtpsetsub(vars, a1, a2, a3, x1 + x2, y1 + y2, a4);
                if (drawflag == 1) {
                    // 前回の足りない部分を水平線で追加表示
                    txtovrsub(vars, a1, a2, a3, x1 - x_old , y1 - y_old, strrepeatsub(a4, x_old - x2));
                    txtovrsub(vars, a1, a2, a3, x1 + x2 + 1, y1 - y_old, strrepeatsub(a4, x_old - x2));
                    txtovrsub(vars, a1, a2, a3, x1 - x_old , y1 + y_old, strrepeatsub(a4, x_old - x2));
                    txtovrsub(vars, a1, a2, a3, x1 + x2 + 1, y1 + y_old, strrepeatsub(a4, x_old - x2));
                }
                drawflag = 1;
                x_old = x2;
                y_old = y2;
            }
            return true;
        });
        add_one_func_tbl_A("txtfcircle", 9, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var x1, y1, x2, y2;
            var r1, a, b;
            var rr, aa, bb;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            r1 = parseInt(param[5], 10);
            a = parseFloat(param[6]);
            b = parseFloat(param[7]);
            a4 = String(param[8]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (r1 > max_str_size) {
            if (!(r1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            if (r1 < 0) { return true; }

            // ***** 描画処理 *****
            if (a < 1) { a = 1; }
            if (b < 1) { b = 1; }
            aa = a * a;
            bb = b * b;
            rr = r1 * r1;
            x2 = r1;
            for (y2 = 0; y2 <= r1; y2++) {
                // 円の内側になるまでループ
                while (aa * x2 * x2 + bb * y2 * y2 >= rr) {
                    x2--;
                    if (x2 < 0) { break; }
                }
                if (x2 < 0) { break; }
                // 両端を結ぶ水平線を表示
                txtovrsub(vars, a1, a2, a3, x1 - x2, y1 - y2, strrepeatsub(a4, 2 * x2 + 1));
                txtovrsub(vars, a1, a2, a3, x1 - x2, y1 + y2, strrepeatsub(a4, 2 * x2 + 1));
            }
            return true;
        });
        add_one_func_tbl_A("txtpoly", 8, [0, 3, 4], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var b1, b2, b3, b4, b5;
            var i, j;
            var pnum;
            var x = [];
            var y = [];

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            b1 = getvarname(param[3]);
            b2 = getvarname(param[4]);
            b3 = parseInt(param[5], 10);
            b4 = parseInt(param[6], 10);
            a4 = String(param[7]);
            if (param.length <= 8) {
                b5 = 0;
            } else {
                b5 = parseInt(param[8], 10);
            }

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;
            b3 = b3 | 0;
            b4 = b4 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する(文字列)配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (b4 - b3 + 1 < 1 || b4 - b3 + 1 > max_array_size) {
            if (!(b4 - b3 + 1 >= 1 && b4 - b3 + 1 <= max_array_size)) {
                throw new Error("処理する(頂点)配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 多角形のライン表示処理 *****

            // ***** 頂点の取得 *****
            j = b3;
            pnum = b4 - b3 + 1;
            for (i = 0; i < pnum; i++) {
                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(b1 + "[" + j + "]")) { return true; }
                // if (!vars.checkVar(b2 + "[" + j + "]")) { return true; }

                // x[i] = parseInt(vars[b1 + "[" + j + "]"], 10);
                x[i] = parseInt(vars.getVarValue(b1 + "[" + j + "]"), 10);
                // y[i] = parseInt(vars[b2 + "[" + j + "]"], 10);
                y[i] = parseInt(vars.getVarValue(b2 + "[" + j + "]"), 10);
                j++;

                // ***** エラーチェック *****
                // if (x[i] > max_str_size || y[i] > max_str_size) {
                if (!(x[i] <= max_str_size && y[i] <= max_str_size)) {
                    throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                }
            }

            // ***** 描画処理 *****
            for (i = 0; i < pnum - 1; i++) {
                // 左右対称になるように調整(ただし上下対称にはならない)
                if (y[i] <= y[i + 1]) {
                    txtlinesub(vars, a1, a2, a3, x[i], y[i], x[i + 1], y[i + 1], a4);
                } else {
                    txtlinesub(vars, a1, a2, a3, x[i + 1], y[i + 1], x[i], y[i], a4);
                }
            }
            if (b5 == 0 && pnum >= 1) {
                // 左右対称になるように調整(ただし上下対称にはならない)
                if (y[pnum - 1] <= y[0]) {
                    txtlinesub(vars, a1, a2, a3, x[pnum - 1], y[pnum - 1], x[0], y[0], a4);
                } else {
                    txtlinesub(vars, a1, a2, a3, x[0], y[0], x[pnum - 1], y[pnum - 1], a4);
                }
            }
            return true;
        });
        add_one_func_tbl_A("txtfpoly", 8, [0, 3, 4], function (param, vars, can, ctx) {
            var a1, a2, a3, a4;
            var b1, b2, b3, b4;
            var i, j;
            var pnum;
            var x = [];
            var y = [];
            var x1, y1, x2, y2;
            var y_min, y_max, ydir_old;
            var e1 = {};
            var edge = [];  // 辺情報
            var edge_sort = function (a,b) { return (a.x - b.x); }; // ソート用(比較関数)
            var edge_num;   // 辺の数
            var wn;         // 巻き数
            var line_start; // 線分開始フラグ

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            b1 = getvarname(param[3]);
            b2 = getvarname(param[4]);
            b3 = parseInt(param[5], 10);
            b4 = parseInt(param[6], 10);
            a4 = String(param[7]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;
            b3 = b3 | 0;
            b4 = b4 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する(文字列)配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (b4 - b3 + 1 < 1 || b4 - b3 + 1 > max_array_size) {
            if (!(b4 - b3 + 1 >= 1 && b4 - b3 + 1 <= max_array_size)) {
                throw new Error("処理する(頂点)配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 多角形の塗りつぶし処理 *****

            // ***** 頂点の取得 *****
            j = b3;
            pnum = b4 - b3 + 1;
            for (i = 0; i < pnum; i++) {
                // // ***** 配列の存在チェック *****
                // if (!vars.checkVar(b1 + "[" + j + "]")) { return true; }
                // if (!vars.checkVar(b2 + "[" + j + "]")) { return true; }

                // x[i] = parseInt(vars[b1 + "[" + j + "]"], 10);
                x[i] = parseInt(vars.getVarValue(b1 + "[" + j + "]"), 10);
                // y[i] = parseInt(vars[b2 + "[" + j + "]"], 10);
                y[i] = parseInt(vars.getVarValue(b2 + "[" + j + "]"), 10);
                j++;

                // ***** エラーチェック *****
                // if (x[i] > max_str_size || y[i] > max_str_size) {
                if (!(x[i] <= max_str_size && y[i] <= max_str_size)) {
                    throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                }
            }

            // ***** 辺情報の取得 *****
            y_min = y[0];
            y_max = y[0];
            for (i = 0; i < pnum; i++) {
                x1 = x[i];
                y1 = y[i];
                if (y1 < y_min) { y_min = y1; }
                if (y1 > y_max) { y_max = y1; }
                x2 = x[(i + 1) % pnum];
                y2 = y[(i + 1) % pnum];
                e1 = {};
                if (y1 == y2) { // 辺が水平のとき
                    e1.a = 0;         // Yが1増えたときのXの増分
                    e1.ydir = 0;      // Y方向の向き
                    e1.y1 = y1;       // 始点のY座標
                    e1.y2 = y2;       // 終点のY座標
                    if (x1 <= x2) {
                        e1.x1 = x1;   // 始点のX座標
                        e1.x2 = x2;   // 終点のX座標
                        e1.x  = x1;   // X座標
                    } else {
                        e1.x1 = x2;   // 始点のX座標
                        e1.x2 = x1;   // 終点のX座標
                        e1.x  = x2;   // X座標
                    }
                } else {        // 辺が水平でないとき
                    e1.a = (x2 - x1) / (y2 - y1); // Yが1増えたときのXの増分
                    if (y1 < y2) {
                        e1.ydir = 1;  // Y方向の向き
                        e1.y1 = y1;   // 始点のY座標
                        e1.y2 = y2;   // 終点のY座標
                        e1.x1 = x1;   // 始点のX座標
                        e1.x2 = x2;   // 終点のX座標
                        e1.x  = x1;   // X座標
                    } else {
                        e1.ydir = -1; // Y方向の向き
                        e1.y1 = y2;   // 始点のY座標
                        e1.y2 = y1;   // 終点のY座標
                        e1.x1 = x2;   // 始点のX座標
                        e1.x2 = x1;   // 終点のX座標
                        e1.x  = x2;   // X座標
                    }
                }
                edge.push(e1);
            }
            edge_num = edge.length;
            // 前の辺とY方向の向きが等しいときは、Y方向の長さを1だけ短くする
            // (つなぎ目を2重にカウントして描画領域が反転するのを防ぐため)
            ydir_old = 0;
            for (i = 0; i <= edge_num; i++) {
                j = i % edge_num; // 1周するために剰余を使用
                if (edge[j].ydir == 0) { continue; }
                if (edge[j].ydir == ydir_old) {
                    if (edge[j].ydir == 1) {
                        edge[j].y1++;
                        edge[j].x += e1.a;
                    } else {
                        edge[j].y2--;
                    }
                }
                ydir_old = edge[j].ydir;
            }

            // ***** 描画処理 *****
            for (y1 = y_min; y1 <= y_max; y1++) {
                // 辺情報をX座標でソートする
                edge.sort(edge_sort);
                // 水平線と各辺の交点を順番に処理する
                wn = 0;
                line_start = false;
                for (i = 0; i < edge_num; i++) {
                    // 交点がなければスキップ
                    if (y1 < edge[i].y1 || y1 > edge[i].y2) { continue; }
                    // 辺が水平のときはそのまま描画する
                    // (描画しないと抜けが発生するパターンがあるため)
                    if (edge[i].ydir == 0) {
                        x1 = edge[i].x1 | 0; // 整数化
                        x2 = edge[i].x2 | 0; // 整数化
                        // 両端を結ぶ水平線を表示
                        txtovrsub(vars, a1, a2, a3, x1, y1, strrepeatsub(a4, x2 - x1 + 1));
                        continue;
                    }
                    // 辺のY方向の向きから巻き数を計算して、0になるまでの領域を塗りつぶす
                    wn += edge[i].ydir;
                    if (!line_start) {
                        line_start = true;

                        // 左右対称になるように調整
                        // x1 = edge[i].x | 0; // 整数化
                        x1 = (edge[i].a > 0) ? Math.round(edge[i].x) : -Math.round(-edge[i].x); // 整数化

                    } else if (wn == 0) {
                        line_start = false;

                        // 左右対称になるように調整
                        // x2 = edge[i].x | 0; // 整数化
                        x2 = (edge[i].a > 0) ? Math.round(edge[i].x) : -Math.round(-edge[i].x); // 整数化

                        // 両端を結ぶ水平線を表示
                        txtovrsub(vars, a1, a2, a3, x1, y1, strrepeatsub(a4, x2 - x1 + 1));
                    }
                    // 辺のX座標に増分を加算する
                    edge[i].x += edge[i].a;
                }
            }
            return true;
        });
        add_one_func_tbl_A("txtreplace", 5, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5;
            var i;
            var st1, st2;
            var src_str;
            var rep_str;
            var reg_exp;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            a4 = String(param[3]);
            a5 = String(param[4]);

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
                st1 = String(st1);
                st2 = st1.replace(reg_exp, rep_str);
                // vars[a1 + "[" + i + "]"] = st2;
                vars.setVarValue(a1 + "[" + i + "]", st2);
            }
            return true;
        });
        add_one_func_tbl_A("txtreplace2", 5, [0], function (param, vars, can, ctx) {
            var a1, a2, a3, a4, a5;
            var i;
            var st1, st2;
            var src_str;
            var rep_func;
            var reg_exp;
            var ch_tbl;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            a4 = String(param[3]);
            a5 = String(param[4]);

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
            rep_func = function (c) { return ch_tbl[c]; };
            reg_exp = new RegExp("[" + src_str + "]", "g");
            ch_tbl = {};
            for (i = 0; i < a4.length; i++) {
                ch_tbl[a4.charAt(i)] = a5.charAt(i);
            }
            for (i = a2; i <= a3; i++) {
                // st1 = vars[a1 + "[" + i + "]"];
                st1 = vars.getVarValue(a1 + "[" + i + "]");
                st1 = String(st1);
                st2 = st1.replace(reg_exp, rep_func);
                // vars[a1 + "[" + i + "]"] = st2;
                vars.setVarValue(a1 + "[" + i + "]", st2);
            }
            return true;
        });
    }


    // ***** 追加の組み込み関数(戻り値あり)の定義情報の生成 *****
    function add_func_tbl_B() {
        // ***** 追加の組み込み関数(戻り値あり)の定義情報を1個ずつ生成 *****
        // (第2引数は関数の引数の数を指定する(ただし省略可能な引数は数に入れない))
        // (第2引数を-1にすると組み込み変数になり、()なしで呼び出せる)
        // (第3引数は「変数名をとる引数」がある場合にその引数番号を配列で指定する)
        add_one_func_tbl_B("audcheck", 0, [], function (param, vars, can, ctx) {
            var num;

            // ***** 音楽モードチェック *****
            if (!MMLPlayer.AudioContext) { return 0; }

            num = 1;
            return num;
        });
        add_one_func_tbl_B("audmakestat", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1 || aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return 0; }
            } else {
                return 0;
            }

            num = 0;
            if (audplayer.hasOwnProperty(a1)) {
                if (audplayer[a1].mmlplayer.compiled == 1) {
                    num = 1;
                }
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            return num;
        });
        add_one_func_tbl_B("audstat", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);

            // ***** 音楽モードチェック *****
            if (aud_mode == 1 || aud_mode == 2) {
                if (!MMLPlayer.AudioContext) { return -1; }
            } else {
                return -1;
            }

            num = 0;
            if (audplayer.hasOwnProperty(a1)) {
                num = audplayer[a1].mmlplayer.getStatus();
            } else {
                throw new Error("音楽プレイヤー" + a1 + " は作成されていません。");
            }
            if (num == 1 || num == 2) { num = 1; } else { num = 0; }
            return num;
        });
        add_one_func_tbl_B("calcfractal", 8, [], function (param, vars, can, ctx) {
            var num;
            var x1, y1;
            var dr, di, mr, mi, cr, ci, tr, ti, zr, zi, rep, norm2;

            x1 = parseFloat(param[0]);
            y1 = parseFloat(param[1]);
            dr = parseFloat(param[2]);
            di = parseFloat(param[3]);
            mr = parseFloat(param[4]);
            mi = parseFloat(param[5]);
            cr = parseFloat(param[6]);
            ci = parseFloat(param[7]);
            if (param.length <= 8) {
                rep = 50;
                norm2 = 4;
            } else {
                rep = parseInt(param[8], 10);
                if (param.length <= 9) {
                    norm2 = 4;
                } else {
                    norm2 = parseFloat(param[9]);
                }
            }

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
        add_one_func_tbl_B("charcode", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = parseInt(param[1], 10);
            }
            num = a1.charCodeAt(a2);
            return num;
        });
        add_one_func_tbl_B("charfrom", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3, a4;
            var pair_flag;

            a1 = parseInt(param[0], 10);
            if (param.length <= 1) {
                a2 = 0;
                pair_flag = false;
            } else {
                a2 = parseInt(param[1], 10);
                pair_flag = true;
            }
            if (pair_flag) {
                // ***** サロゲートペア指定のとき *****
                num = String.fromCharCode(a1, a2);
            } else {
                // ***** UTF-16の文字コードを実際のコード(サロゲートペア)に変換 *****
                if (a1 > 0xffff) {
                    a2 = a1 - 0x10000;
                    a3 = 0xd800 + (a2 >> 10);      // 上位サロゲート
                    a4 = 0xdc00 + (a2 & 0x3ff);    // 下位サロゲート
                    num = String.fromCharCode(a3, a4);
                } else {
                    num = String.fromCharCode(a1); // サロゲートペアを使用しない文字のとき
                }
            }
            return num;
        });
        add_one_func_tbl_B("fboxchk", 8, [], function (param, vars, can, ctx) {
            var num;
            var x1, y1, x2, y2;
            var w1, h1, w2, h2;

            x1 = parseFloat(param[0]);
            y1 = parseFloat(param[1]);
            w1 = parseFloat(param[2]);
            h1 = parseFloat(param[3]);
            x2 = parseFloat(param[4]);
            y2 = parseFloat(param[5]);
            w2 = parseFloat(param[6]);
            h2 = parseFloat(param[7]);
            if (x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1) {
                num = 1;
            } else {
                num = 0;
            }
            return num;
        });
        add_one_func_tbl_B("frombinstr", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = parseInt(a1, 2);
            return num;
        });
        add_one_func_tbl_B("fromhexstr", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = parseInt(a1, 16);
            return num;
        });
        // ***** 数値の文字列を加算して文字列で返す命令の追加 *****
        // (例. y=intstradd("100","200")  を実行すると y="300"  となる)
        // (例. y=intstradd("100","-200") を実行すると y="-100" となる)
        add_one_func_tbl_B("intstradd", 2, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;
            var x = {};
            var y = {};
            var z = {};

            a1 = String(param[0]); // 数値の文字列1
            a2 = String(param[1]); // 数値の文字列2

            // ***** 10進数オブジェクトの生成 *****
            DigitCalc.make_digit_obj(x, a1, true);
            DigitCalc.make_digit_obj(y, a2, true);
            DigitCalc.make_digit_obj(z, "NaN", true);
            // ***** 10進数オブジェクトの加算 *****
            DigitCalc.add_digit_obj(x, y, z);
            // ***** 10進数オブジェクトから符号付文字列を取得する *****
            num = DigitCalc.get_digit_obj_signed_str(z);
            return num;
        });
        // ***** 数値の文字列を乗算して文字列で返す命令の追加 *****
        // (例. y=intstrmul("100","200")  を実行すると y="20000"  となる)
        // (例. y=intstrmul("100","-200") を実行すると y="-20000" となる)
        add_one_func_tbl_B("intstrmul", 2, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;
            var x = {};
            var y = {};
            var z = {};

            a1 = String(param[0]); // 数値の文字列1
            a2 = String(param[1]); // 数値の文字列2

            // ***** 10進数オブジェクトの生成 *****
            DigitCalc.make_digit_obj(x, a1, false);
            DigitCalc.make_digit_obj(y, a2, false);
            DigitCalc.make_digit_obj(z, "NaN", false);
            // ***** 10進数オブジェクトの乗算 *****
            DigitCalc.mul_digit_obj(x, y, z);
            // ***** 10進数オブジェクトから符号付文字列を取得する *****
            num = DigitCalc.get_digit_obj_signed_str(z);
            return num;
        });
        // ***** 数値の文字列を除算して文字列で返す命令の追加 *****
        // (例. y=intstrdiv("10","3")   を実行すると y="3"   となる)
        // (例. y=intstrdiv("10","-3")  を実行すると y="-3"  となる)
        // (例. y=intstrdiv("10","3",1) を実行すると y="1"   となる(第3引数を1にすると余りを返す))
        // (例. y=intstrdiv("10","3",2) を実行すると y="3,1" となる(第3引数を2にすると商と余りをカンマ区切りで返す))
        add_one_func_tbl_B("intstrdiv", 2, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3;
            var x = {};  // 被除数
            var y = {};  // 除数
            var z = {};  // 商
            var z2 = {}; // 余り

            a1 = String(param[0]); // 数値の文字列1
            a2 = String(param[1]); // 数値の文字列2
            if (param.length <= 2) {
                a3 = 0;
            } else {
                a3 = parseInt(param[2], 10); // 戻り値のタイプ指定
            }

            // ***** 10進数オブジェクトの生成 *****
            DigitCalc.make_digit_obj(x, a1, false);
            DigitCalc.make_digit_obj(y, a2, false);
            DigitCalc.make_digit_obj(z, "NaN", false);
            DigitCalc.make_digit_obj(z2, "NaN", false);
            // ***** 10進数オブジェクトの除算 *****
            DigitCalc.div_digit_obj(x, y, z, z2);
            // ***** 10進数オブジェクトから符号付文字列を取得する *****
            if (a3 == 1) {        // 余りを返す
                num = DigitCalc.get_digit_obj_signed_str(z2);
            } else if (a3 == 2) { // 商と余りをカンマで区切って返す
                num = DigitCalc.get_digit_obj_signed_str(z) + "," + DigitCalc.get_digit_obj_signed_str(z2);
            } else {              // 商を返す
                num = DigitCalc.get_digit_obj_signed_str(z);
            }
            return num;
        });
        add_one_func_tbl_B("misfreeno", 0, [], function (param, vars, can, ctx) {
            var num;
            var mis, mis_no;
            var range_use, min_no, max_no;

            if (param.length <= 1) {
                range_use = false;
                min_no = 0;
                max_no = 0;
            } else {
                range_use = true;
                min_no = parseInt(param[0], 10);
                max_no = parseInt(param[1], 10);
            }
            // ***** ミサイル空番号を検索 *****
            num = -1;
            for (mis_no in missile) {
                if (missile.hasOwnProperty(mis_no)) {
                    mis = missile[mis_no];
                    if (range_use == false || (mis.no >= min_no && mis.no <= max_no)) {
                        mis.useflag = parseInt(vars.getVarValue(mis.useflag_var_name), 10);
                        if (mis.useflag == 0) {
                            num = mis.no;
                        }
                    }
                }
            }
            return num;
        });
        add_one_func_tbl_B("randint", 2, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3;

            a1 = parseInt(param[0], 10);
            a2 = parseInt(param[1], 10);
            if (a1 > a2) { a3 = a2; a2 = a1; a1 = a3; }
            // min から max までの整数の乱数を返す
            // (Math.round() を用いると、非一様分布になるのでNG)
            // num = Math.floor(Math.random() * (max - min + 1)) + min;
            num = Math.floor(Math.random() * (a2 - a1 + 1)) + a1;
            return num;
        });
        add_one_func_tbl_B("strmake", 2, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            a2 = parseInt(param[1], 10);

            // ***** エラーチェック *****
            // if (a2 > max_str_size) {
            if (!(a2 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }

            num = strrepeatsub(a1, a2);
            return num;
        });
        add_one_func_tbl_B("strovr", 3, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3, a4;

            a1 = String(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = String(param[2]);
            if (param.length <= 3) {
                a4 = 0;
            } else {
                a4 = parseInt(param[3], 10);
            }
            if (a4 == 1) {
                num = strovrsub2(a1, a2, a3);
            } else if (a4 == 2) {
                num = strovrsub3(a1, a2, a3);
            } else {
                num = strovrsub(a1, a2, a3);
            }
            return num;
        });
        add_one_func_tbl_B("tobinstr", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            num = a1.toString(2);
            return num;
        });
        add_one_func_tbl_B("tofloat", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = a1;
            return num;
        });
        add_one_func_tbl_B("tohankaku", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = "";
            } else {
                a2 = String(param[1]);
            }
            num = ConvZenHan.toHankaku(a1, a2);
            return num;
        });
        add_one_func_tbl_B("tohexstr", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            num = a1.toString(16);
            return num;
        });
        add_one_func_tbl_B("toint", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            num = a1;
            return num;
        });
        add_one_func_tbl_B("tolower", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.toLowerCase();
            return num;
        });
        add_one_func_tbl_B("tostr", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1;
            return num;
        });
        add_one_func_tbl_B("toupper", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.toUpperCase();
            return num;
        });
        add_one_func_tbl_B("tozenkaku", 1, [], function (param, vars, can, ctx) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = "";
            } else {
                a2 = String(param[1]);
            }
            num = ConvZenHan.toZenkaku(a1, a2);
            return num;
        });
        add_one_func_tbl_B("txtbchk", 8, [0], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3, a4;
            var x1, y1, x2, y2, x3, y3, x4, y4;
            var i, j;
            var ch;
            var st1;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);
            x2 = parseInt(param[5], 10);
            y2 = parseInt(param[6], 10);
            a4 = String(param[7]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }
            // if (x1 > max_str_size || y1 > max_str_size) {
            if (!(x1 <= max_str_size && y1 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            // if (x2 > max_str_size || y2 > max_str_size) {
            if (!(x2 <= max_str_size && y2 <= max_str_size)) {
                throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
            }
            if (a4.length == 0) { return 0; }

            // ***** 取得処理 *****
            if (x1 > x2) { x3 = x2; x4 = x1; } else { x3 = x1; x4 = x2; }
            if (y1 > y2) { y3 = y2; y4 = y1; } else { y3 = y1; y4 = y2; }
            num = 0;
            for (i = y3; i <= y4; i++) {
                if (i >= a2 && i <= a3) {

                    // ***** 配列の存在チェック *****
                    if (!vars.checkVar(a1 + "[" + i + "]")) { continue; }

                    // st1 = vars[a1 + "[" + i + "]"];
                    st1 = vars.getVarValue(a1 + "[" + i + "]");
                    st1 = String(st1);
                    for (j = x3; j <= x4; j++) {
                        if (j >= 0 && j < st1.length) {
                            ch = st1.charAt(j);
                            if (a4.indexOf(ch) >= 0) { num = 1; }
                        }
                    }
                }
            }
            return num;
        });
        add_one_func_tbl_B("txtpget", 5, [0], function (param, vars, can, ctx) {
            var num;
            var a1, a2, a3;
            var x1, y1;
            var st1;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = parseInt(param[2], 10);
            x1 = parseInt(param[3], 10);
            y1 = parseInt(param[4], 10);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a3 = a3 | 0;

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            // ***** 取得処理 *****
            num = "";
            if (y1 >= a2 && y1 <= a3) {

                // ***** 配列の存在チェック *****
                if (!vars.checkVar(a1 + "[" + y1 + "]")) { return ""; }

                // st1 = vars[a1 + "[" + y1 + "]"];
                st1 = vars.getVarValue(a1 + "[" + y1 + "]");
                st1 = String(st1);
                if (x1 >= 0 && x1 < st1.length) {
                    num = st1.substring(x1, x1 + 1);
                }
            }
            return num;
        });
    }

    // ****************************************
    //                補助関数等
    // ****************************************

    // ***** 文字列配列のライン表示処理サブ *****
    function txtlinesub(vars, var_name, min_y, max_y, x1, y1, x2, y2, ch) {
        var x3, y3;
        var dx1, dy1, sx1, sy1, e1;
        var i;
        var ch1;

        // ***** ライン表示処理 *****
        if ((x2 - x1) > 0) {
            dx1 = x2 - x1; sx1 =  1;
        } else if ((x2 - x1) < 0) {
            dx1 = x1 - x2; sx1 = -1;
        } else {
            dx1 = 0; sx1 = 0;
        }
        if ((y2 - y1) > 0) {
            dy1 = y2 - y1; sy1 =  1;
        } else if ((y2 - y1) < 0) {
            dy1 = y1 - y2; sy1 = -1;
        } else {
            dy1 = 0; sy1 = 0;
        }
        x3 = x1;
        y3 = y1;
        if (dx1 >= dy1) {
            e1 = -dx1;
            for (i = 0; i <= dx1; i++) {
                ch1 = ch.substring(i % ch.length, (i % ch.length) + 1);
                txtpsetsub(vars, var_name, min_y, max_y, x3, y3, ch1);
                x3 = x3 + sx1;
                e1 = e1 + 2 * dy1;
                if (e1 >= 0) {
                    y3 = y3 + sy1;
                    e1 = e1 - 2 * dx1;
                }
            }
        } else {
            e1 = -dy1;
            for (i = 0; i <= dy1; i++) {
                ch1 = ch.substring(i % ch.length, (i % ch.length) + 1);
                txtpsetsub(vars, var_name, min_y, max_y, x3, y3, ch1);
                y3 = y3 + sy1;
                e1 = e1 + 2 * dx1;
                if (e1 >= 0) {
                    x3 = x3 + sx1;
                    e1 = e1 - 2 * dy1;
                }
            }
        }
    }
    // ***** 文字列配列の点設定処理サブ *****
    function txtpsetsub(vars, var_name, min_y, max_y, x, y, ch) {
        var st1;

        // ***** エラーチェック *****
        if (ch.length == 0) { return; }
        if (ch.length > 1) { ch = ch.substring(0, 1); }
        // ***** 点設定処理 *****
        if (y >= min_y && y <= max_y) {

            // // ***** 配列の存在チェック *****
            // if (!vars.checkVar(var_name + "[" + y + "]")) { return; }

            // st1 = vars[var_name + "[" + y + "]"];
            st1 = vars.getVarValue(var_name + "[" + y + "]");
            st1 = String(st1);
            if (x >= 0 && x < st1.length) {
                st1 = st1.substring(0, x) + ch + st1.substring(x + 1);
                // vars[var_name + "[" + y + "]"] = st1;
                vars.setVarValue(var_name + "[" + y + "]", st1);
            }
        }
    }
    // ***** 文字列配列の上書き処理サブ *****
    function txtovrsub(vars, var_name, min_y, max_y, x, y, st2) {
        var st1;

        // ***** 上書き処理 *****
        if (y >= min_y && y <= max_y) {
            // st1 = vars[var_name + "[" + y + "]"];
            st1 = vars.getVarValue(var_name + "[" + y + "]");
            st1 = String(st1);
            st1 = strovrsub(st1, x, st2);
            // vars[var_name + "[" + y + "]"] = st1;
            vars.setVarValue(var_name + "[" + y + "]", st1);
        }
    }
    // ***** 文字列配列の上書き処理サブ2 *****
    // (半角/全角スペース以外を上書きする。他は「文字列配列の上書き処理サブ」と同じ)
    function txtovrsub2(vars, var_name, min_y, max_y, x, y, st2) {
        var st1;

        // ***** 上書き処理 *****
        // (半角/全角スペース以外を上書きする)
        if (y >= min_y && y <= max_y) {
            // st1 = vars[var_name + "[" + y + "]"];
            st1 = vars.getVarValue(var_name + "[" + y + "]");
            st1 = String(st1);
            st1 = strovrsub2(st1, x, st2);
            // vars[var_name + "[" + y + "]"] = st1;
            vars.setVarValue(var_name + "[" + y + "]", st1);
        }
    }
    // ***** 文字列配列の上書き処理サブ3 *****
    // (半角/全角スペースのみ上書きする。他は「文字列配列の上書き処理サブ」と同じ)
    function txtovrsub3(vars, var_name, min_y, max_y, x, y, st2) {
        var st1;

        // ***** 上書き処理 *****
        // (半角/全角スペースのみ上書きする)
        if (y >= min_y && y <= max_y) {
            // st1 = vars[var_name + "[" + y + "]"];
            st1 = vars.getVarValue(var_name + "[" + y + "]");
            st1 = String(st1);
            st1 = strovrsub3(st1, x, st2);
            // vars[var_name + "[" + y + "]"] = st1;
            vars.setVarValue(var_name + "[" + y + "]", st1);
        }
    }
    // ***** 文字列の繰り返し処理サブ *****
    function strrepeatsub(st1, count) {
        var ret_st;

        // ***** 戻り値の初期化 *****
        ret_st = "";
        // ***** エラーチェック *****
        if (st1.length == 0 || count <= 0) { return ret_st; }
        // ***** 繰り返し処理 *****
        while (ret_st.length < count) {
            if (ret_st.length + st1.length < count) {
                ret_st += st1;
            } else {
                ret_st += st1.substring(0, count - ret_st.length);
            }
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }
    // ***** 文字列の上書き処理サブ *****
    // (文字列st1の位置xから文字列st2を上書きした文字列を返す。
    //  ただし返す文字列の長さはst1の長さとする(はみ出した部分はカット)。
    //  位置xは先頭文字を0とする)
    function strovrsub(st1, x, st2) {
        var ret_st;
        var st1_len, st2_len;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** 文字列長の取得(キャッシュ用) *****
        st1_len = st1.length;
        st2_len = st2.length;
        // ***** エラーチェック *****
        if (st1_len == 0 || st2_len == 0) { return ret_st; }
        // ***** 上書き処理 *****
        // (境界の条件によって場合分け)
        if        (x < 0  && (x + st2_len) <  st1_len) {
            ret_st = st2.substring(-x) + st1.substring(x + st2_len);
        } else if (x < 0  && (x + st2_len) >= st1_len) {
            ret_st = st2.substring(-x, -x + st1_len);
        } else if (x >= 0 && (x + st2_len) <  st1_len) {
            ret_st = st1.substring(0, x) + st2 + st1.substring(x + st2_len);
        } else if (x >= 0 && (x + st2_len) >= st1_len) {
            ret_st = st1.substring(0, x) + st2.substring(0, st1_len - x);
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }
    // ***** 文字列の上書き処理サブ2 *****
    // (半角/全角スペース以外を上書きする。他は「文字列の上書き処理サブ」と同じ)
    function strovrsub2(st1, x, st2) {
        var i;
        var ch;
        var ret_st;
        var ret_st_len;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** 上書き処理 *****
        // (半角/全角スペース以外を上書きする)
        ret_st_len = ret_st.length;
        for (i = 0; i < st2.length; i++) {
            ch = st2.charAt(i);
            if (ch != " " && ch != "　") {
                // ret_st = strovrsub(ret_st, x, ch);
                if (x >= 0 && x < ret_st_len) {
                    ret_st = ret_st.substring(0, x) + ch + ret_st.substring(x + 1);
                }
            }
            x++;
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }
    // ***** 文字列の上書き処理サブ3 *****
    // (半角/全角スペースのみ上書きする。他は「文字列の上書き処理サブ」と同じ)
    function strovrsub3(st1, x, st2) {
        var i;
        var ch;
        var ret_st;
        var ret_st_len;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** 上書き処理 *****
        // (半角/全角スペースのみ上書きする)
        ret_st_len = ret_st.length;
        for (i = 0; i < st2.length; i++) {
            ch = st2.charAt(i);
            if (ch == " " || ch == "　") {
                // ret_st = strovrsub(ret_st, x, ch);
                if (x >= 0 && x < ret_st_len) {
                    ret_st = ret_st.substring(0, x) + ch + ret_st.substring(x + 1);
                }
            }
            x++;
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }

    // ***** 音楽全停止 *****
    function audstopall() {
        var aud_no;
        for (aud_no in audplayer) {
            if (audplayer.hasOwnProperty(aud_no)) {
                audplayer[aud_no].mmlplayer.stop();
                delete audplayer[aud_no];
            }
        }
    }


})(Plugin0001 || (Plugin0001 = {}));


// ***** 以下は外部クラス *****


// ***** 10進数計算用クラス(整数のみ対応)(staticクラス) *****
var DigitCalc = (function () {
    // ***** コンストラクタ *****
    // ***** (staticクラスのため未使用) *****
    function DigitCalc() { }

    // ***** 定数 *****
    DigitCalc.MAX_DIGIT_LEN = 10000;  // 処理する10進数の最大桁数

    // ***** 10進数オブジェクトの生成(staticメソッド) *****
    // (数値文字列num_stから10進数オブジェクトxを生成する)
    // (xには空のオブジェクトを渡すこと。以下のプロパティがセットされて返る。
    //    x.sign      : 符号文字列
    //    x.str       : 数値文字列
    //    x.digit[i]  : 各桁の値の配列(0オリジン)
    //    x.digit_len : 桁数 )
    DigitCalc.make_digit_obj = function (x, num_st, use_minus_digit) {
        var reg_exp;
        var ret;
        var i;
        var arr_st;
        var exp_num;
        var int_st;
        var frac_st;

        // ***** オブジェクトの初期化 *****
        x.sign = "+";
        x.str = "";
        x.digit = [];
        x.digit_len = 0;
        // ***** エラーチェック *****
        if (num_st == "NaN") {
            x.str = "NaN";
            return;
        }
        if (num_st == "Infinity" || num_st == "+Infinity") {
            x.str = "Infinity";
            return;
        }
        if (num_st == "-Infinity") {
            x.sign = "-";
            x.str = "Infinity";
            return;
        }
        // ***** 符号と数値(整数部のみ)を取り出す *****
        reg_exp = /^([+\-])?0*(\d+)(?:\.(\d*))?(?:[eE]([+\-]?\d*))?/;
        ret = reg_exp.exec(num_st);
        if (ret) {
            // (符号)
            if (ret[1]) { x.sign = ret[1]; } else { x.sign = "+"; }
            // (整数部)
            if (ret[2]) { int_st = ret[2]; } else { int_st = ""; }
            // (小数部)
            if (ret[3]) { frac_st = ret[3]; } else { frac_st = ""; }
            // (指数部)
            if (ret[4]) {
                exp_num = parseInt(ret[4], 10);
                // (整数部に指数部を反映)
                if (exp_num > 0) {
                    // ***** エラーチェック *****
                    if (exp_num + int_st.length > DigitCalc.MAX_DIGIT_LEN) {
                        x.str = "Infinity";
                        return;
                    }
                    arr_st = [];
                    for (i = 0; i < exp_num; i++) { arr_st[i] = "0"; }
                    frac_st += arr_st.join("");
                    int_st += frac_st.substring(0, exp_num);
                } else if (exp_num < 0) {
                    int_st = int_st.substring(0, int_st.length + exp_num);
                }
            }
            if (int_st != "") { x.str = int_st; } else { x.str = "0"; }
        } else {
            x.str = "NaN";
            return;
        }
        // ***** エラーチェック *****
        if (x.str.length > DigitCalc.MAX_DIGIT_LEN) {
            x.str = "Infinity";
            return;
        }
        // ***** 数値を各桁に分解する *****
        arr_st = x.str.split("");
        x.digit_len = arr_st.length;
        // x.digit = [];
        if (use_minus_digit) {
            for (i = 0; i < x.digit_len; i++) {
                x.digit[i] = parseInt(x.sign + arr_st[x.digit_len - i - 1], 10);
            }
        } else {
            for (i = 0; i < x.digit_len; i++) {
                x.digit[i] = parseInt(arr_st[x.digit_len - i - 1], 10);
            }
        }
    };

    // ***** 10進数オブジェクトの文字列を更新する(staticメソッド) *****
    DigitCalc.update_digit_obj_str = function (x, use_minus_digit) {
        var reg_exp;
        var ret;
        var i;
        var arr_st;

        // ***** エラーチェック *****
        if (!x.digit_len) { return; }
        // ***** 数値の各桁を文字列に変換 *****
        arr_st = [];
        if (use_minus_digit) {
            for (i = 0; i < x.digit_len; i++) {
                if (x.digit[i] < 0) {
                    arr_st[x.digit_len - i - 1] = String(-x.digit[i]);
                } else {
                    arr_st[x.digit_len - i - 1] = String(x.digit[i]);
                }
            }
        } else {
            for (i = 0; i < x.digit_len; i++) {
                arr_st[x.digit_len - i - 1] = String(x.digit[i]);
            }
        }
        x.str = arr_st.join("");
        // ***** 先頭の0を削除 *****
        reg_exp = /^0*(\d+)/;
        ret = reg_exp.exec(x.str);
        if (ret && ret[1]) { x.str = ret[1]; } else { x.str = "0"; }
        // ***** エラーチェック *****
        if (x.str.length > DigitCalc.MAX_DIGIT_LEN) {
            x.str = "Infinity";
            // return;
        }
    };

    // ***** 10進数オブジェクトから符号付文字列を取得する(staticメソッド) *****
    DigitCalc.get_digit_obj_signed_str = function (x) {
        if (x.sign == "-" && x.str != "0" && x.str != "NaN") {
            return ("-" + x.str);
        }
        return x.str;
    };

    // ***** 10進数オブジェクトの加算(staticメソッド) *****
    DigitCalc.add_digit_obj = function (x, y, z) {
        var i;

        // ***** エラーチェック *****
        if (x.str == "NaN" || y.str == "NaN") {
            z.str = "NaN";
            return;
        }
        if (x.str == "Infinity" && y.str == "Infinity" && x.sign != y.sign) {
            z.str = "NaN";
            return;
        }
        if (x.str == "Infinity") {
            z.sign = x.sign;
            z.str = "Infinity";
            return;
        }
        if (y.str == "Infinity") {
            z.sign = y.sign;
            z.str = "Infinity";
            return;
        }
        // ***** 各桁を加算する *****
        if (x.digit_len >= y.digit_len) {
            z.digit_len = x.digit_len + 1;
            z.digit = [];
            for (i = 0; i < y.digit_len; i++) {
                z.digit[i] = x.digit[i] + y.digit[i];
            }
            for (i = y.digit_len; i < x.digit_len; i++) {
                z.digit[i] = x.digit[i];
            }
        } else {
            z.digit_len = y.digit_len + 1;
            z.digit = [];
            for (i = 0; i < x.digit_len; i++) {
                z.digit[i] = y.digit[i] + x.digit[i];
            }
            for (i = x.digit_len; i < y.digit_len; i++) {
                z.digit[i] = y.digit[i];
            }
        }
        z.digit[z.digit_len - 1] = 0;
        // ***** 各桁の桁あふれを処理する *****
        for (i = 0; i < z.digit_len - 1; i++) {
            if (z.digit[i] >= 10) {
                z.digit[i] -= 10;
                z.digit[i + 1]++;
            } else if (z.digit[i] <= -10) {
                z.digit[i] += 10;
                z.digit[i + 1]--;
            }
        }
        // ***** 結果の符号を求める *****
        z.sign = "+";
        for (i = z.digit_len - 1; i >= 0; i--) {
            if (z.digit[i] < 0) { z.sign = "-"; break; }
            if (z.digit[i] > 0) { z.sign = "+"; break; }
        }
        // ***** 各桁の符号を合わせる *****
        if (z.sign == "+") {
            for (i = 0; i < z.digit_len - 1; i++) {
                if (z.digit[i] < 0) {
                    z.digit[i] += 10;
                    z.digit[i + 1]--;
                }
            }
        } else {
            for (i = 0; i < z.digit_len - 1; i++) {
                if (z.digit[i] > 0) {
                    z.digit[i] -= 10;
                    z.digit[i + 1]++;
                }
            }
        }
        // ***** 10進数オブジェクトの文字列を更新する *****
        DigitCalc.update_digit_obj_str(z, true);
    };

    // ***** 10進数オブジェクトの乗算(staticメソッド) *****
    DigitCalc.mul_digit_obj = function (x, y, z) {
        var i, j;
        var carry_num;

        // ***** エラーチェック *****
        if (x.str == "NaN" || y.str == "NaN") {
            z.str = "NaN";
            return;
        }
        if ((x.str == "Infinity" && y.str == "0") || (x.str == "0" && y.str == "Infinity")) {
            z.str = "NaN";
            return;
        }
        if (x.str == "Infinity" || y.str == "Infinity") {
            if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
            z.str = "Infinity";
            return;
        }
        if (x.digit_len + y.digit_len - 1 > DigitCalc.MAX_DIGIT_LEN) {
            if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
            z.str = "Infinity";
            return;
        }
        // ***** 各桁を乗算する *****
        z.digit_len = x.digit_len + y.digit_len;
        z.digit = [];
        for (i = 0; i < z.digit_len; i++) {
            z.digit[i] = 0;
        }
        for (i = 0; i < x.digit_len; i++) {
            for (j = 0; j < y.digit_len; j++) {
                z.digit[i + j] += x.digit[i] * y.digit[j];
                if (z.digit[i + j] >= 10) {
                    carry_num = parseInt(z.digit[i + j] / 10, 10);
                    z.digit[i + j]     -= carry_num * 10;
                    z.digit[i + j + 1] += carry_num;
                }
            }
        }
        // ***** 結果の符号を求める *****
        if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
        // ***** 10進数オブジェクトの文字列を更新する *****
        DigitCalc.update_digit_obj_str(z, false);
    };

    // ***** 10進数オブジェクトの除算(staticメソッド) *****
    DigitCalc.div_digit_obj = function (x, y, z, z2) {
        var i, j;
        var minus_flag;
        var minus_count;

        // ***** エラーチェック *****
        if (x.str == "NaN" || y.str == "NaN") {
            z.str = "NaN";
            return;
        }
        if (x.str == "Infinity" && y.str == "Infinity") {
            z.str = "NaN";
            return;
        }
        if (x.str == "Infinity") {
            if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
            z.str = "Infinity";
            return;
        }
        if (y.str == "Infinity") {
            z.sign = "+";
            z.str = "0";
            z2.sign = x.sign;
            z2.str = x.str;
            return;
        }
        // ***** 0除算チェック *****
        if (y.str == "0") {
            if (x.str == "0") {
                z.str = "NaN";
            } else {
                if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
                z.str = "Infinity";
            }
            return;
        }
        // ***** 除算処理 *****
        z.digit_len = x.digit_len;
        z2.digit_len = y.digit_len + 1;
        z.digit = [];
        for (i = 0; i < z.digit_len; i++) {
            z.digit[i] = 0;
        }
        z2.digit = [];
        for (i = 0; i < z2.digit_len; i++) {
            z2.digit[i] = 0;
        }
        for (i = x.digit_len - 1; i >= 0; i--) {
            // ***** 余りを左シフト *****
            for (j = z2.digit_len - 2; j >= 0; j--) {
                z2.digit[j + 1] = z2.digit[j];
            }
            // ***** 余りの最下位桁を被除数のi桁目と同じに設定 *****
            z2.digit[0] = x.digit[i];
            // ***** 余りから除数を引く *****
            minus_count = 0;
            while (true) {
                minus_flag = true;
                if (z2.digit[z2.digit_len - 1] == 0) {
                    for (j = z2.digit_len - 2; j >= 0; j--) {
                        if (z2.digit[j] > y.digit[j]) { break; }
                        if (z2.digit[j] < y.digit[j]) { minus_flag = false; break; }
                    }
                }
                if (!minus_flag) { break; }
                minus_count++;
                for (j = 0; j < y.digit_len; j++) {
                    z2.digit[j] = z2.digit[j] - y.digit[j];
                    if (z2.digit[j] < 0) {
                        z2.digit[j] += 10;
                        z2.digit[j + 1]--;
                    }
                }
            }
            // ***** 引けた回数を商のi桁目の値とする *****
            z.digit[i] = minus_count;
        }
        // ***** 結果の符号を求める *****
        if (x.sign == y.sign) { z.sign = "+"; } else { z.sign = "-"; }
        z2.sign = x.sign;
        // ***** 10進数オブジェクトの文字列を更新する *****
        DigitCalc.update_digit_obj_str(z, false);
        DigitCalc.update_digit_obj_str(z2, false);
    };

    return DigitCalc; // これがないとクラスが動かないので注意
})();


// ***** 文字列の全角半角変換用クラス(staticクラス) *****
var ConvZenHan = (function () {
    // ***** コンストラクタ *****
    // ***** (staticクラスのため未使用) *****
    function ConvZenHan() { }

    // ***** 全角に変換する(staticメソッド) *****
    ConvZenHan.toZenkaku = function (st1, mode1) {
        var ret_st;

        // ***** 引数のチェック *****
        if (!st1) { st1 = ""; }
        if (!mode1) { mode1 = "anpskd"; }
        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** アルファベットを全角に変換 *****
        if (mode1.indexOf("a") >= 0) {
            ret_st = ret_st.replace(/[\u0041-\u005A]|[\u0061-\u007A]/g,
                function (c) {
                    if (!ConvZenHan.alphaToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.alphaToZenkaku[c];
                }
            );
        }
        // ***** 数字を全角に変換 *****
        if (mode1.indexOf("n") >= 0) {
            ret_st = ret_st.replace(/[\u0030-\u0039]/g,
                function (c) {
                    if (!ConvZenHan.numberToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.numberToZenkaku[c];
                }
            );
        }
        // ***** 記号を全角に変換 *****
        if (mode1.indexOf("p") >= 0) {
            ret_st = ret_st.replace(/[\u0021-\u007E]|[\uFF61-\uFF64]|[\u00A2-\u00A5]/g,
                function (c) {
                    if (!ConvZenHan.punctuationToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.punctuationToZenkaku[c];
                }
            );
        }
        // ***** スペースを全角に変換 *****
        if (mode1.indexOf("s") >= 0) {
            ret_st = ret_st.replace(/ /g,
                function (c) {
                    if (!ConvZenHan.spaceToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.spaceToZenkaku[c];
                }
            );
        }

        // ***** カタカナを全角に変換 *****
        if (mode1.indexOf("k") >= 0 || mode1.indexOf("h") >= 0) {
            ret_st = ret_st.replace(/[\uFF65-\uFF9D][ﾞﾟ]?/g,
                function (c) {
                    if (!ConvZenHan.katakanaToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.katakanaToZenkaku[c];
                }
            );
        }
        // ***** カタカナ(全角)をひらがなに変換 *****
        if (mode1.indexOf("h") >= 0) {
            ret_st = ret_st.replace(/[\u30A1-\u30FC]/g,
                function (c) {
                    if (!ConvZenHan.KatakanaToHiragana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.KatakanaToHiragana[c];
                }
            );
        }
        // ***** ひらがなをカタカナ(全角)に変換 *****
        if (mode1.indexOf("t") >= 0) {
            ret_st = ret_st.replace(/[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.HiraganaToKatakana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.HiraganaToKatakana[c];
                }
            );
        }

        // ***** 濁点を結合 *****
        if (mode1.indexOf("m") >= 0) {
            ret_st = ret_st.replace(/[\u30A1-\u30FC][ﾞﾟ゛゜]?|[\u3041-\u3094][ﾞﾟ゛゜]?/g,
                function (c) {
                    if (!ConvZenHan.DakutenMarge.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenMarge[c];
                }
            );
        }
        // ***** 濁点を分離 *****
        if (mode1.indexOf("v") >= 0) {
            ret_st = ret_st.replace(/[\u30A1-\u30FC]|[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.DakutenSplit.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenSplit[c];
                }
            );
        }
        // ***** 濁点を全角に変換 *****
        if (mode1.indexOf("d") >= 0) {
            ret_st = ret_st.replace(/[ﾞﾟ]/g,
                function (c) {
                    if (!ConvZenHan.DakutenToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenToZenkaku[c];
                }
            );
        }
        // ***** 戻り値を返す *****
        return ret_st;
    };

    // ***** 半角に変換する(staticメソッド) *****
    ConvZenHan.toHankaku = function (st1, mode1) {
        var ret_st;

        // ***** 引数のチェック *****
        if (!st1) { st1 = ""; }
        if (!mode1) { mode1 = "anpskd"; }
        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** アルファベットを半角に変換 *****
        if (mode1.indexOf("a") >= 0) {
            ret_st = ret_st.replace(/[\uFF21-\uFF3A]|[\uFF41-\uFF5A]/g,
                function (c) {
                    if (!ConvZenHan.alphaToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.alphaToHankaku[c];
                }
            );
        }
        // ***** 数字を半角に変換 *****
        if (mode1.indexOf("n") >= 0) {
            ret_st = ret_st.replace(/[\uFF10-\uFF19]/g,
                function (c) {
                    if (!ConvZenHan.numberToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.numberToHankaku[c];
                }
            );
        }
        // ***** 記号を半角に変換 *****
        if (mode1.indexOf("p") >= 0) {
            ret_st = ret_st.replace(/[\uFF01-\uFF5E]|[\u3001-\u300D]|[\uFFE0-\uFFE5]/g,
                function (c) {
                    if (!ConvZenHan.punctuationToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.punctuationToHankaku[c];
                }
            );
        }
        // ***** スペースを半角に変換 *****
        if (mode1.indexOf("s") >= 0) {
            ret_st = ret_st.replace(/[\u3000]/g,
                function (c) {
                    if (!ConvZenHan.spaceToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.spaceToHankaku[c];
                }
            );
        }

        // ***** ひらがなをカタカナ(全角)に変換 *****
        if (mode1.indexOf("t") >= 0) {
            ret_st = ret_st.replace(/[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.HiraganaToKatakana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.HiraganaToKatakana[c];
                }
            );
        }
        // ***** カタカナを半角に変換 *****
        if (mode1.indexOf("k") >= 0 || mode1.indexOf("t") >= 0) {
            ret_st = ret_st.replace(/[\u30A1-\u30FC]/g,
                function (c) {
                    if (!ConvZenHan.katakanaToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.katakanaToHankaku[c];
                }
            );
        }

        // ***** 濁点を分離 *****
        if (mode1.indexOf("v") >= 0) {
            ret_st = ret_st.replace(/[\u30A1-\u30FC]|[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.DakutenSplit.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenSplit[c];
                }
            );
        }
        // ***** 濁点を半角に変換 *****
        if (mode1.indexOf("d") >= 0) {
            ret_st = ret_st.replace(/[゛゜]/g,
                function (c) {
                    if (!ConvZenHan.DakutenToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenToHankaku[c];
                }
            );
        }
        // ***** 戻り値を返す *****
        return ret_st;
    };

    // ***** 以下は内部処理用 *****

    // ***** 変換テーブル生成(内部処理用)(staticメソッド) *****
    ConvZenHan.makeTable = function () {
        var i;
        var han, zen;
        var ch, cz, cz2;

        // alert("ConvZenHan.makeTable:-:実行されました。");
        // ***** アルファベット *****
        ConvZenHan.alphaToZenkaku = {};
        ConvZenHan.alphaToHankaku = {};
        for (i = 0x41; i <= 0x5A; i++) { // 「A」～「Z」
            ConvZenHan.alphaToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.alphaToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        for (i = 0x61; i <= 0x7A; i++) { // 「a」～「z」
            ConvZenHan.alphaToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.alphaToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        // ***** 数字 *****
        ConvZenHan.numberToZenkaku = {};
        ConvZenHan.numberToHankaku = {};
        for (i = 0x30; i <= 0x39; i++) { // 「0」～「9」
            ConvZenHan.numberToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.numberToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        // ***** 記号 *****
        ConvZenHan.punctuationToZenkaku = {};
        ConvZenHan.punctuationToHankaku = {};
        for (i = 0x21; i <= 0x2F; i++) { // 「!」～「/」
            ConvZenHan.punctuationToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.punctuationToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        for (i = 0x3A; i <= 0x40; i++) { // 「:」～「@」
            ConvZenHan.punctuationToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.punctuationToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        for (i = 0x5B; i <= 0x60; i++) { // 「[」～「`」
            ConvZenHan.punctuationToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.punctuationToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        for (i = 0x7B; i <= 0x7E; i++) { // 「{」～「~」
            ConvZenHan.punctuationToZenkaku[String.fromCharCode(i)] = String.fromCharCode(i + 0xFEE0);
            ConvZenHan.punctuationToHankaku[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
        }
        ConvZenHan.punctuationToZenkaku["\uFF61"] = "。"; // 「。」の文字コードは \u3002
        ConvZenHan.punctuationToZenkaku["\uFF62"] = "「"; // 「「」の文字コードは \u300C
        ConvZenHan.punctuationToZenkaku["\uFF63"] = "」"; // 「」」の文字コードは \u300D
        ConvZenHan.punctuationToZenkaku["\uFF64"] = "、"; // 「、」の文字コードは \u3001
        ConvZenHan.punctuationToZenkaku["\u00A2"] = "￠"; // 「￠」の文字コードは \uFFE0
        ConvZenHan.punctuationToZenkaku["\u00A3"] = "￡"; // 「￡」の文字コードは \uFFE1
        ConvZenHan.punctuationToZenkaku["\u00A5"] = "￥"; // 「￥」の文字コードは \uFFE5
        ConvZenHan.punctuationToHankaku["。"] = "\uFF61";
        ConvZenHan.punctuationToHankaku["「"] = "\uFF62";
        ConvZenHan.punctuationToHankaku["」"] = "\uFF63";
        ConvZenHan.punctuationToHankaku["、"] = "\uFF64";
        ConvZenHan.punctuationToHankaku["￠"] = "\u00A2";
        ConvZenHan.punctuationToHankaku["￡"] = "\u00A3";
        ConvZenHan.punctuationToHankaku["￥"] = "\u00A5";
        // ***** スペース *****
        ConvZenHan.spaceToZenkaku = {};
        ConvZenHan.spaceToHankaku = {};
        han = " ";      // 半角スペース (\u0020)
        zen = "\u3000"; // 全角スペース (\u3000)
        for (i = 0; i < han.length; i++) {
            ConvZenHan.spaceToZenkaku[han.charAt(i)] = zen.charAt(i);
            ConvZenHan.spaceToHankaku[zen.charAt(i)] = han.charAt(i);
        }
        // ***** カタカナ *****
        ConvZenHan.katakanaToZenkaku = {};
        ConvZenHan.katakanaToHankaku = {};
        han = "ｱｲｳｴｵｧｨｩｪｫｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔｬﾕｭﾖｮﾗﾘﾙﾚﾛﾜｦﾝｰ･";
        zen = "アイウエオァィゥェォカキクケコサシスセソタチツッテトナニヌネノハヒフヘホマミムメモヤャユュヨョラリルレロワヲンー・";
        for (i = 0; i < han.length; i++) {
            ch = han.charAt(i);
            cz = zen.charAt(i);
            ConvZenHan.katakanaToZenkaku[ch] = cz;
            ConvZenHan.katakanaToHankaku[cz] = ch;
            if (cz.match(/[カキクケコサシスセソタチツテトハヒフヘホ]/)) {
                ConvZenHan.katakanaToZenkaku[ch + "ﾞ"] = String.fromCharCode(cz.charCodeAt(0) + 1);
                ConvZenHan.katakanaToHankaku[String.fromCharCode(cz.charCodeAt(0) + 1)] = ch + "ﾞ";
            } else {
                ConvZenHan.katakanaToZenkaku[ch + "ﾞ"] = cz + "ﾞ";   // その他の濁点はそのまま
            }
            if (cz.match(/[ハヒフヘホ]/)) {
                ConvZenHan.katakanaToZenkaku[ch + "ﾟ"] = String.fromCharCode(cz.charCodeAt(0) + 2);
                ConvZenHan.katakanaToHankaku[String.fromCharCode(cz.charCodeAt(0) + 2)] = ch + "ﾟ";
            } else {
                ConvZenHan.katakanaToZenkaku[ch + "ﾟ"] = cz + "ﾟ";   // その他の半濁点はそのまま
            }
        }
        ConvZenHan.katakanaToZenkaku["ｳﾞ"] = "\u30F4";
        ConvZenHan.katakanaToZenkaku["ﾜﾞ"] = "\u30F7";
        ConvZenHan.katakanaToZenkaku["ｦﾞ"] = "\u30FA";
        ConvZenHan.katakanaToHankaku["\u30F4"] = "ｳﾞ";
        ConvZenHan.katakanaToHankaku["\u30F7"] = "ﾜﾞ";
        ConvZenHan.katakanaToHankaku["\u30FA"] = "ｦﾞ";
        // ***** ひらがなとカタカナ *****
        ConvZenHan.HiraganaToKatakana = {};
        ConvZenHan.KatakanaToHiragana = {};
        for (i = 0x3041; i <= 0x3094; i++) { // 「あ」の小文字 ～ 「う」の濁点
            ConvZenHan.HiraganaToKatakana[String.fromCharCode(i)] = String.fromCharCode(i + 0x60);
            ConvZenHan.KatakanaToHiragana[String.fromCharCode(i + 0x60)] = String.fromCharCode(i);
        }
        // ***** 濁点と半濁点 *****
        ConvZenHan.DakutenToZenkaku = {};
        ConvZenHan.DakutenToHankaku = {};
        han = "ﾞﾟ";
        zen = "゛゜";
        for (i = 0; i < han.length; i++) {
            ConvZenHan.DakutenToZenkaku[han.charAt(i)] = zen.charAt(i);
            ConvZenHan.DakutenToHankaku[zen.charAt(i)] = han.charAt(i);
        }
        ConvZenHan.DakutenSplit = {};
        ConvZenHan.DakutenMarge = {};
        han = "ｱｲｳｴｵｧｨｩｪｫｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔｬﾕｭﾖｮﾗﾘﾙﾚﾛﾜｦﾝｰ･";
        zen = "アイウエオァィゥェォカキクケコサシスセソタチツッテトナニヌネノハヒフヘホマミムメモヤャユュヨョラリルレロワヲンー・";
        for (i = 0; i < han.length; i++) {
            ch = han.charAt(i);
            cz = zen.charAt(i);
            cz2 = String.fromCharCode(cz.charCodeAt(0) - 0x60); // ひらがな
            if (cz.match(/[カキクケコサシスセソタチツテトハヒフヘホ]/)) {
                ConvZenHan.DakutenSplit[String.fromCharCode(cz.charCodeAt(0) + 1)] = cz + "ﾞ";
                ConvZenHan.DakutenSplit[String.fromCharCode(cz2.charCodeAt(0) + 1)] = cz2 + "ﾞ";
                ConvZenHan.DakutenMarge[cz + "ﾞ"] = String.fromCharCode(cz.charCodeAt(0) + 1);
                ConvZenHan.DakutenMarge[cz2 + "ﾞ"] = String.fromCharCode(cz2.charCodeAt(0) + 1);
                ConvZenHan.DakutenMarge[cz + "゛"] = String.fromCharCode(cz.charCodeAt(0) + 1);
                ConvZenHan.DakutenMarge[cz2 + "゛"] = String.fromCharCode(cz2.charCodeAt(0) + 1);
            }
            if (cz.match(/[ハヒフヘホ]/)) {
                ConvZenHan.DakutenSplit[String.fromCharCode(cz.charCodeAt(0) + 2)] = cz + "ﾟ";
                ConvZenHan.DakutenSplit[String.fromCharCode(cz2.charCodeAt(0) + 2)] = cz2 + "ﾟ";
                ConvZenHan.DakutenMarge[cz + "ﾟ"] = String.fromCharCode(cz.charCodeAt(0) + 2);
                ConvZenHan.DakutenMarge[cz2 + "ﾟ"] = String.fromCharCode(cz2.charCodeAt(0) + 2);
                ConvZenHan.DakutenMarge[cz + "゜"] = String.fromCharCode(cz.charCodeAt(0) + 2);
                ConvZenHan.DakutenMarge[cz2 + "゜"] = String.fromCharCode(cz2.charCodeAt(0) + 2);
            }
        }
        ConvZenHan.DakutenSplit["\u30F4"] = "ウﾞ";
        ConvZenHan.DakutenSplit["\u30F7"] = "ワﾞ";
        ConvZenHan.DakutenSplit["\u30F8"] = "ヰﾞ";
        ConvZenHan.DakutenSplit["\u30F9"] = "ヱﾞ";
        ConvZenHan.DakutenSplit["\u30FA"] = "ヲﾞ";
        ConvZenHan.DakutenSplit["\u3094"] = "うﾞ";
        ConvZenHan.DakutenMarge["ウﾞ"] = "\u30F4";
        ConvZenHan.DakutenMarge["ワﾞ"] = "\u30F7";
        ConvZenHan.DakutenMarge["ヰﾞ"] = "\u30F8";
        ConvZenHan.DakutenMarge["ヱﾞ"] = "\u30F9";
        ConvZenHan.DakutenMarge["ヲﾞ"] = "\u30FA";
        ConvZenHan.DakutenMarge["うﾞ"] = "\u3094";
        ConvZenHan.DakutenMarge["ウ゛"] = "\u30F4";
        ConvZenHan.DakutenMarge["ワ゛"] = "\u30F7";
        ConvZenHan.DakutenMarge["ヰ゛"] = "\u30F8";
        ConvZenHan.DakutenMarge["ヱ゛"] = "\u30F9";
        ConvZenHan.DakutenMarge["ヲ゛"] = "\u30FA";
        ConvZenHan.DakutenMarge["う゛"] = "\u3094";
    };

    // ***** 変換テーブルをここで1回だけ生成 *****
    ConvZenHan.makeTable();

    return ConvZenHan; // これがないとクラスが動かないので注意
})();


// ***** 領域塗りつぶし用クラス *****
var FloodFill = (function () {
    // ***** コンストラクタ *****
    function FloodFill(can, ctx, x, y, threshold, paint_mode, bound_col, bound_alpha) {
        // ***** 初期化 *****
        this.can = can;               // Canvas要素
        this.ctx = ctx;               // Canvasのコンテキスト
        this.width = can.width;       // Canvasの幅(px)
        this.height = can.height;     // Canvasの高さ(px)
        this.x = x | 0;               // 塗りつぶし開始座標X(px)
        this.y = y | 0;               // 塗りつぶし開始座標Y(px)
        this.threshold = threshold;   // 同色と判定するしきい値(0-255)
        this.paint_mode = paint_mode; // 塗りつぶしモード(=0:同一色領域, =1:境界色指定)
        this.paint_col = {};          // 塗りつぶされる色(オブジェクト)
        this.paint_col.r = 0;         // 塗りつぶされる色 R
        this.paint_col.g = 0;         // 塗りつぶされる色 G
        this.paint_col.b = 0;         // 塗りつぶされる色 B
        this.paint_col.a = 0;         // 塗りつぶされる色 alpha
        this.bound_col = {};                             // 境界色(オブジェクト)
        this.bound_col.r = (bound_col & 0xff0000) >> 16; // 境界色 R
        this.bound_col.g = (bound_col & 0x00ff00) >> 8;  // 境界色 G
        this.bound_col.b = (bound_col & 0x0000ff);       // 境界色 B
        this.bound_col.a = bound_alpha;                  // 境界色 alpha
        this.seed_buf = [];           // シードバッファ(配列)
        this.img_data = {};           // 画像データ(オブジェクト)
    }
    // ***** 点の色を取得(内部処理用) *****
    FloodFill.prototype.getPixel = function (x, y) {
        var ret_col = {};

        // ***** 戻り値の初期化 *****
        ret_col.r = 0;
        ret_col.g = 0;
        ret_col.b = 0;
        ret_col.a = 0;
        // ***** エラーチェック *****
        if (x < 0 || x >= this.width)  { return ret_col; }
        if (y < 0 || y >= this.height) { return ret_col; }
        // ***** 点の色を取得 *****
        ret_col.r = this.img_data.data[(x + y * this.width) * 4];
        ret_col.g = this.img_data.data[(x + y * this.width) * 4 + 1];
        ret_col.b = this.img_data.data[(x + y * this.width) * 4 + 2];
        ret_col.a = this.img_data.data[(x + y * this.width) * 4 + 3];
        // ***** 戻り値を返す *****
        return ret_col;
    };
    // ***** 境界色のチェック(内部処理用) *****
    FloodFill.prototype.checkColor = function (x, y) {
        var ret;
        var diff2;
        var pixel_col;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** エラーチェック *****
        if (x < 0 || x >= this.width)  { return ret; }
        if (y < 0 || y >= this.height) { return ret; }
        // ***** 色の比較 *****
        pixel_col = this.getPixel(x, y);
        if (this.paint_mode == 0) {
            diff2 = (this.paint_col.r - pixel_col.r) * (this.paint_col.r - pixel_col.r) +
                    (this.paint_col.g - pixel_col.g) * (this.paint_col.g - pixel_col.g) +
                    (this.paint_col.b - pixel_col.b) * (this.paint_col.b - pixel_col.b) +
                    (this.paint_col.a - pixel_col.a) * (this.paint_col.a - pixel_col.a);
        } else {
            diff2 = (this.bound_col.r - pixel_col.r) * (this.bound_col.r - pixel_col.r) +
                    (this.bound_col.g - pixel_col.g) * (this.bound_col.g - pixel_col.g) +
                    (this.bound_col.b - pixel_col.b) * (this.bound_col.b - pixel_col.b) +
                    (this.bound_col.a - pixel_col.a) * (this.bound_col.a - pixel_col.a);
        }
        if (diff2 <= this.threshold * this.threshold * 4) { ret = true; } // 4倍してスケールを合わせる
        // ***** 戻り値を返す *****
        if (this.paint_mode != 0) {
            ret = !ret;
        }
        return ret;
    };
    // ***** 線分をスキャンしてシードを登録(内部処理用) *****
    FloodFill.prototype.scanLine = function (x1, x2, y, y_from) {
        var x, x1_tmp;
        var seed_info = {};

        // ***** 線分をスキャン *****
        x = x1;
        while (x <= x2) {
            // ***** 非領域色をスキップ *****
            while (x <= x2) {
                if (this.checkColor(x, y)) { break; }
                x++;
            }
            if (x > x2) { break; }
            x1_tmp = x;
            // ***** 領域色をスキャン *****
            while (x <= x2) {
                if (!this.checkColor(x, y)) { break; }
                x++;
            }
            // ***** シードを登録 *****
            seed_info = {};
            seed_info.x1 = x1_tmp;     // 左端座標X1
            seed_info.x2 = x - 1;      // 右端座標X2
            seed_info.y = y;           // 水平座標Y
            seed_info.y_from = y_from; // 親シードの水平座標Y_From
            this.seed_buf.push(seed_info);
        }
    };
    // ***** 塗りつぶし処理 *****
    FloodFill.prototype.fill = function () {
        var i;
        var x, y;
        var x1, x2;
        var seed_info = {};
        var filled_buf = [];

        // ***** エラーチェック *****
        if (this.x < 0 || this.x >= this.width)  { return false; }
        if (this.y < 0 || this.y >= this.height) { return false; }
        // ***** 画像データを取得 *****
        this.img_data = this.ctx.getImageData(0, 0, this.width, this.height);
        // ***** 塗りつぶされる色を取得 *****
        this.paint_col = this.getPixel(this.x, this.y);
        // ***** 塗りつぶし済みチェック用のバッファを生成 *****
        filled_buf = [];
        for (i = 0; i < this.width * this.height; i++) {
            filled_buf[i] = 0;
        }
        // ***** 開始点をシード登録 *****
        seed_info = {};
        seed_info.x1 = this.x;     // 左端座標X1
        seed_info.x2 = this.x;     // 右端座標X2
        seed_info.y = this.y;      // 水平座標Y
        seed_info.y_from = this.y; // 親シードの水平座標Y_From
        this.seed_buf.push(seed_info);
        // ***** シードがなくなるまでループ *****
        while (this.seed_buf.length > 0) {
            // ***** シードを1個取り出す *****
            seed_info = this.seed_buf.shift();
            x = seed_info.x1;
            y = seed_info.y;
            // ***** 塗りつぶし済みならば処理をしない *****
            if (filled_buf[x + y * this.width] == 1) { continue; }
            // ***** 左方向の境界を探す *****
            x1 = seed_info.x1;
            while (x1 > 0) {
                if (!this.checkColor(x1 - 1, y)) { break; }
                x1--;
            }
            // ***** 右方向の境界を探す *****
            x2 = seed_info.x2;
            while (x2 < this.width - 1) {
                if (!this.checkColor(x2 + 1, y)) { break; }
                x2++;
            }
            // ***** 線分を描画して、塗りつぶし済みチェック用のバッファを更新 *****
            this.ctx.fillRect(x1, y, x2 - x1 + 1, 1);
            for (x = x1; x <= x2; x++) {
                filled_buf[x + y * this.width] = 1;
            }
            // ***** 1つ上の線分をスキャン *****
            if (y - 1 >= 0) {
                if (y - 1 == seed_info.y_from) {
                    if (seed_info.x1 >= 0 && x1 < seed_info.x1) {
                        this.scanLine(x1, seed_info.x1 - 1, y - 1, y);
                    }
                    if (seed_info.x2 < this.width && seed_info.x2 < x2) {
                        this.scanLine(seed_info.x2 + 1, x2, y - 1, y);
                    }
                } else {
                    this.scanLine(x1, x2, y - 1, y);
                }
            }
            // ***** 1つ下の線分をスキャン *****
            if (y + 1 < this.height) {
                if (y + 1 == seed_info.y_from) {
                    if (seed_info.x1 >= 0 && x1 < seed_info.x1) {
                        this.scanLine(x1, seed_info.x1 - 1, y + 1, y);
                    }
                    if (seed_info.x2 < this.width && seed_info.x2 < x2) {
                        this.scanLine(seed_info.x2 + 1, x2, y + 1, y);
                    }
                } else {
                    this.scanLine(x1, x2, y + 1, y);
                }
            }
        }
        return true;
    };
    return FloodFill; // これがないとクラスが動かないので注意
})();


// ***** ミサイル用クラス *****
var Missile = (function () {
    // ***** コンストラクタ *****
    function Missile(no, useflag, x100, y100, degree, speed100, ch,
        min_x, max_x, min_y, max_y, div_x, div_y,
        useflag_var_name, x100_var_name, y100_var_name,
        degree_var_name, speed100_var_name, ch_var_name) {
        // ***** 初期化 *****
        this.no = no;                               // ミサイル番号
        this.useflag = useflag;                     // 有効フラグ
        this.x100 = x100;                           // 座標x(文字で数える)の100倍の値
        this.y100 = y100;                           // 座標y(文字で数える)の100倍の値
        this.degree = degree;                       // 角度(0-360)
        this.speed100 = speed100;                   // 速度の100倍の値
        this.ch = ch;                               // 表示する文字列
        this.min_x = min_x;                         // xの最小値
        this.max_x = max_x;                         // xの最大値
        this.min_y = min_y;                         // yの最小値
        this.max_y = max_y;                         // yの最大値
        this.div_x = div_x;                         // x方向の速度の倍率の逆数
        this.div_y = div_y;                         // y方向の速度の倍率の逆数
        this.useflag_var_name = useflag_var_name;   // 有効フラグ の変数名
        this.x100_var_name = x100_var_name;         // 座標x(文字で数える)の100倍の値 の変数名
        this.y100_var_name = y100_var_name;         // 座標y(文字で数える)の100倍の値 の変数名
        this.degree_var_name = degree_var_name;     // 角度(0-360) の変数名
        this.speed100_var_name = speed100_var_name; // 速度の100倍の値 の変数名
        this.ch_var_name = ch_var_name;             // 表示する文字列 の変数名

        this.x100_add = 0;                          // x方向の増分の100倍の値(一時保存用)
        this.y100_add = 0;                          // y方向の増分の100倍の値(一時保存用)

        // ***** 0除算エラー対策 *****
        if (this.div_x == 0) { this.div_x = 1; }
        if (this.div_y == 0) { this.div_y = 1; }
    }
    // ***** 移動 *****
    Missile.prototype.move = function () {
        var x0, y0;
        var x1, y1;
        var dx, dy;
        var tan1;

        // ***** 有効チェック *****
        if (this.useflag != 0) {
            // ***** 移動前の座標 *****
            x0 = (this.x100 / 100) | 0;
            y0 = (this.y100 / 100) | 0;

            // ***** 次の座標を計算 *****
            this.x100 = this.x100 + this.speed100 * Math.cos(this.degree * Math.PI / 180) / this.div_x;
            this.y100 = this.y100 + this.speed100 * Math.sin(this.degree * Math.PI / 180) / this.div_y;
            this.x100 = this.x100 | 0; // 整数化
            this.y100 = this.y100 | 0; // 整数化

            // ***** 移動後の座標 *****
            x1 = (this.x100 / 100) | 0;
            y1 = (this.y100 / 100) | 0;

            // ***** 斜め移動を若干なめらかにする処理 *****
            // (x座標とy座標が交互に変化してカクカクする現象を抑制する)
            dx = x1 - x0;
            dy = y1 - y0;
            tan1 = Math.tan(this.degree * Math.PI / 180) * this.div_x / this.div_y;
            if (tan1 >= -1 && tan1 <= 1) {
                // (角度が45度以下のとき、x座標の変化に合わせてy座標を変化させる)
                this.x100_add = 0;
                if (dx == 0) {
                    if (dy >= 1 || dy <= -1) {
                        this.y100     -= dy * 100;
                        this.y100_add += dy * 100;
                    }
                } else {
                    if (this.y100_add != 0) {
                        this.y100 += this.y100_add;
                        this.y100_add = 0;
                    }
                }
            } else {
                // (角度が45度より大きいとき、y座標の変化に合わせてx座標を変化させる)
                this.y100_add = 0;
                if (dy == 0) {
                    if (dx >= 1 || dx <= -1) {
                        this.x100     -= dx * 100;
                        this.x100_add += dx * 100;
                    }
                } else {
                    if (this.x100_add != 0) {
                        this.x100 += this.x100_add;
                        this.x100_add = 0;
                    }
                }
            }

            // ***** 座標の範囲チェック *****
            // ***** NaN対策 *****
            // (NaNの!=以外の比較はfalseになるので、そのとき無効になるように 条件を逆にしておく)
            // if (x1 < this.min_x || x1 > this.max_x || y1 < this.min_y || y1 > this.max_y) {
            if (!(x1 >= this.min_x && x1 <= this.max_x && y1 >= this.min_y && y1 <= this.max_y)) {
                // ***** 範囲外なら無効にする *****
                this.useflag = 0;
                this.x100_add = 0;
                this.y100_add = 0;
            }
        }
    };
    return Missile; // これがないとクラスが動かないので注意
})();


// ***** MML音楽演奏用クラス *****
var MMLPlayer = (function () {
    // ***** コンストラクタ *****
    function MMLPlayer() {
        // ***** Web Audio API関係 *****
        this.node = null;    // 音声バッファソースノード(操作用オブジェクト)
        this.gnode = null;   // ゲインノード  (音量調整用オブジェクト)
        this.gain = 1;       // ゲイン        (音量)(0-1)
        this.speed_rate = 1; // 再生速度レート(=1:等倍)
        this.play_state = 0; // 再生状態(=0:停止, =1:演奏開始中, =2:演奏中, =3:演奏終了)
        this.adbuf = null;   // 音声バッファ  (管理用オブジェクト)
        this.addata = [];    // 音声データ    (配列)(Float32Arrayで各要素は-1～1までの値)
        this.pos = [];       // 音声データ位置(配列)(チャンネルごと)(単位は絶対音長(4分音符が48になる))
        this.tempo_chg = []; // テンポ変更情報(配列)(全チャンネル共通)
        this.compiled = 0;   // コンパイル状態(=0:未,=1:コンパイル中,=2:完了)
    }
    // ***** 定数 *****
    MMLPlayer.MAX_CH = 8;          // 最大チャンネル数(増やすと音が小さくなる)
    MMLPlayer.SAMPLE_RATE = 22050; // サンプリングレート(Hz)(これより小さいとエラー)

    // ***** Chrome v23 で何回もnewするとエラーになるため *****
    // ***** ここで1回だけnewする *****
    MMLPlayer.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (MMLPlayer.AudioContext) {
        MMLPlayer.adctx = new MMLPlayer.AudioContext(); // 音声コンテキスト
    }

    // ***** 再生状態取得 *****
    // (戻り値は =0:停止, =1:演奏開始中, =2:演奏中, =3:演奏終了)
    MMLPlayer.prototype.getStatus = function () {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return 0; }
        // ***** 未再生のチェック *****
        if (!this.node) { return 0; }
        // ***** 再生状態を返す *****
        if (typeof (this.node.playbackState) != "undefined") {
            return this.node.playbackState;
        }
        return this.play_state;
    };
    // ***** 音量設定 *****
    MMLPlayer.prototype.setVolume = function (volume) {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** ゲイン(音量)設定 *****
        this.gain = volume / 100;
        if (this.gain < 0) { this.gain = 0; }
        if (this.gain > 1) { this.gain = 1; }
        if (this.gnode) {
            this.gnode.gain.value = this.gain;
        }
        return true;
    };
    // ***** 再生速度レート設定 *****
    MMLPlayer.prototype.setSpeedRate = function (speed_rate) {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 再生速度レート設定 *****
        this.speed_rate = speed_rate;
        if (this.node) {
            this.node.playbackRate.value = this.speed_rate;
        }
        return true;
    };
    // ***** 再生 *****
    // (引数を非0にするとループ再生)
    MMLPlayer.prototype.play = function (repeat_flag) {
        var self; // this保存用

        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 停止 *****
        this.stop();
        // ***** コンパイル完了のチェック *****
        if (this.compiled < 2) { return false; }
        // ***** 再生 *****
        // (毎回ここで 音声バッファソースノードを作らないと 連続再生できなかった)
        // (ノードの接続は、ソースノード → ゲインノード → 出力先 の順となる)
        this.node = MMLPlayer.adctx.createBufferSource();
        this.node.buffer = this.adbuf;
        if (repeat_flag) { this.node.loop = true; } else { this.node.loop = false; }
        this.node.playbackRate.value = this.speed_rate;
        self = this;
        this.node.onended = function () { self.play_state = 3; };
        if (MMLPlayer.adctx.createGainNode) {
            this.gnode = MMLPlayer.adctx.createGainNode();
        } else {
            this.gnode = MMLPlayer.adctx.createGain();
        }
        this.gnode.gain.value = this.gain;
        this.node.connect(this.gnode);
        this.gnode.connect(MMLPlayer.adctx.destination);
        if (this.node.noteOn) {
            this.node.noteOn(0);
        } else {
            this.node.start(0);
        }
        // ***** 再生状態変更 *****
        this.play_state = 2;
        return true;
    };
    // ***** 停止 *****
    MMLPlayer.prototype.stop = function () {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 未再生のチェック *****
        if (!this.node) { return false; }
        // ***** 停止 *****
        if (this.node.noteOff) {
            this.node.noteOff(0);
        } else {
            this.node.stop(0);
        }
        this.node.disconnect();
        this.node = null;
        this.gnode.disconnect();
        this.gnode = null;
        // ***** 再生状態変更 *****
        this.play_state = 0;
        return true;
    };
    // ***** MMLを設定してコンパイルする *****
    MMLPlayer.prototype.setMML = function (mml_st) {
        var i;
        var addata_len;  // 必要な音声バッファのサイズ
        var chdata_len;  // チャンネル1個の音声バッファのサイズ
        var tempo_sort = function (a,b) { return (a.pos - b.pos); }; // ソート用(比較関数)

        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 引数のチェック *****
        if (!mml_st) { return false; }
        // ***** 停止 *****
        this.stop();
        // ***** コンパイル中にする *****
        this.compiled = 1;
        // ***** MMLの前処理 *****
        mml_st = this.preprocess(mml_st);
        // ***** コンパイル(パス1) *****
        // (テンポ変更情報を抽出して、必要な音声バッファのサイズを計算可能とする)
        this.compile(mml_st, 1);
        // ***** テンポ変更情報のソート *****
        this.tempo_chg.sort(tempo_sort);
        // ***** 実時間テーブル作成 *****
        this.makeTimeTable();
        // DebugShow("pos=" + JSON.stringify(this.pos) + "\n");
        // DebugShow("tempo_chg=" + JSON.stringify(this.tempo_chg) + "\n");
        // ***** 音声バッファの確保 *****
        // (一番長いチャンネルのサイズを全体のサイズとする)
        addata_len = 0;
        for (i = 0; i < MMLPlayer.MAX_CH; i++) {
            chdata_len = MMLPlayer.SAMPLE_RATE * this.getRealTime(this.pos[i]);
            if (addata_len < chdata_len) { addata_len = chdata_len; }
        }
        if (addata_len == 0) { return false; } // DOMエラー対応
        addata_len++; // 誤差対策で+1
        this.adbuf = MMLPlayer.adctx.createBuffer(1, addata_len, MMLPlayer.SAMPLE_RATE);
        this.addata = this.adbuf.getChannelData(0);
        // ***** コンパイル(パス2) *****
        // (実際に音声データの値を計算して、音声バッファに格納する)
        this.compile(mml_st, 2);
        // // ***** 音声データの範囲チェック *****
        // for (i = 0; i < addata_len; i++) {
        //     if (this.addata[i] < -1) { this.addata[i] = -1; }
        //     if (this.addata[i] >  1) { this.addata[i] =  1; }
        // }
        // ***** コンパイル完了 *****
        this.compiled = 2;
        return true;
    };
    // ***** 音楽データを設定してコンパイルする *****
    // (MMLではなくて、data URI schemeで音楽データ(mp3等)を直接渡す場合に
    //  使用する (setMMLの代わりに使用する) )
    // (decodeAudioData()が非同期のため、コンパイル完了までに時間がかかる
    //  ので注意)
    MMLPlayer.prototype.setAUDData = function (aud_data_st) {
        var i;
        var bin_st;     // バイナリデータ文字列
        var bin_st_len; // バイナリデータ文字列の長さ
        // var mime_st;    // MIME文字列
        var uint8_arr;  // バイナリデータ(型付配列)
        var self;       // this保存用

        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 引数のチェック *****
        if (!aud_data_st) { return false; }
        // ***** 停止 *****
        this.stop();
        // ***** コンパイル中にする *****
        this.compiled = 1;
        // ***** 音楽データを設定 *****
        // (Base64の文字列をバイナリデータに変換してデコードする)
        bin_st = atob(aud_data_st.split(",")[1]);
        // mime_st = aud_data_st.split(",")[0].split(":")[1].split(";")[0];
        bin_st_len = bin_st.length;
        uint8_arr = new Uint8Array(bin_st_len);
        for (i = 0; i < bin_st_len; i++) {
            uint8_arr[i] = bin_st.charCodeAt(i);
        }
        self = this;
        MMLPlayer.adctx.decodeAudioData(uint8_arr.buffer, function (adbuf) {
            self.adbuf = adbuf;
            // ***** コンパイル完了 *****
            self.compiled = 2;
        });
        return true;
    };

    // ***** 以下は内部処理用 *****

    // ***** 実時間テーブル作成(内部処理用) *****
    MMLPlayer.prototype.makeTimeTable = function () {
        var i;
        var rtime;    // 実時間(sec)
        var pos_last; // 音声データ位置保存用(単位は絶対音長(4分音符が48になる))
        var tempo;    // テンポ(1分間に演奏する4分音符の数)

        // ***** 「テンポ変更位置の実時間」を計算して保存しておく *****
        rtime = 0;
        pos_last = 0;
        tempo = 120;
        for (i = 0; i < this.tempo_chg.length; i++) {
            rtime += (this.tempo_chg[i].pos - pos_last) * 60 / 48 / tempo;
            this.tempo_chg[i].rtime = rtime;
            pos_last = this.tempo_chg[i].pos;
            tempo = this.tempo_chg[i].val;
        }
    };
    // ***** 実時間取得(内部処理用) *****
    MMLPlayer.prototype.getRealTime = function (pos) {
        var i;
        var rtime;    // 実時間(sec)
        var pos_last; // 音声データ位置保存用(単位は絶対音長(4分音符が48になる))
        var tempo;    // テンポ(1分間に演奏する4分音符の数)

        // ***** 音声データ位置から実時間を計算して返す *****
        // ***** (事前に計算した「テンポ変更位置の実時間」を利用する) *****
        rtime = 0;
        pos_last = 0;
        tempo = 120;
        for (i = 0; i < this.tempo_chg.length; i++) {
            if (this.tempo_chg[i].pos >= pos) { break; }
        }
        if (i > 0) {
            rtime = this.tempo_chg[i - 1].rtime;
            pos_last = this.tempo_chg[i - 1].pos;
            tempo = this.tempo_chg[i - 1].val;
        }
        rtime += (pos - pos_last) * 60 / 48 / tempo;
        return rtime;
    };
    // ***** 音符追加(内部処理用) *****
    // MMLPlayer.prototype.addNote = function (ch, note, velocity, nlength1, nlength2) {
    MMLPlayer.prototype.addNote = function (ch, note, nlength1, nlength2, prog, volume, pass_no) {
        var i;
        var rtime1;  // 音符開始位置の実時間(sec)
        var rtime2;  // 音符終了位置の実時間(sec)
        var nlen1;   // 音長  (単位は実時間(sec)xサンプリングレート(Hz))
        var nlen2;   // 発音長(単位は実時間(sec)xサンプリングレート(Hz))
        var freq;    // 音符の周波数(Hz)
        var t;       // 時間(sec)
        var phase;   // 位相(ラジアン)
        var wave;    // 波形(-1～1まで)
        var fade;    // フェードアウト割合(0-1まで)

        var PI;      // 定数キャッシュ用
        var phase_c; // 定数キャッシュ用
        var amp_c;   // 定数キャッシュ用
        var pos_int; // 定数キャッシュ用

        // ***** 音符追加 *****
        if (pass_no == 2) {
            // ***** 音長計算 *****
            // (音符の途中でテンポが変わることを考慮する)
            rtime1 = this.getRealTime(this.pos[ch]);
            rtime2 = this.getRealTime(this.pos[ch] + nlength1);
            nlen1 = MMLPlayer.SAMPLE_RATE * (rtime2 - rtime1);
            // ***** 発音長計算 *****
            if (nlength1 > 0) {
                nlen2 = nlen1 * nlength2 / nlength1;
            } else {
                nlen2 = 0;
            }
            // ***** 音符の周波数計算 *****
            freq = 13.75 * Math.pow(2, (note - 9) / 12);

            // ***** 定数を先に計算しておく *****
            PI = Math.PI;
            phase_c = 2 * PI * freq;
            amp_c = volume / 127 / MMLPlayer.MAX_CH;
            pos_int = parseInt(MMLPlayer.SAMPLE_RATE * rtime1, 10);

            // ***** 音声データの値を計算 *****
            for (i = 0; i < nlen1; i++) {
                // phase = 2 * Math.PI * freq * i / MMLPlayer.SAMPLE_RATE;
                t = i / MMLPlayer.SAMPLE_RATE;
                phase = phase_c * t;
                switch (prog) {
                    case 0:   // 方形波
                        wave = (Math.sin(phase) > 0) ? 1 : -1;
                        break;
                    case 1:   // 正弦波
                        wave = Math.sin(phase);
                        break;
                    case 2:   // のこぎり波
                        wave = (phase % (PI * 2)) / PI - 1;
                        break;
                    case 3:   // 三角波
                        wave = 2 * Math.asin(Math.sin(phase)) / PI;
                        break;
                    case 4:   // ホワイトノイズ
                        wave = Math.random() * 2 - 1;
                        break;
                    case 500: // ピアノ(仮)
                        wave = 1.3 * ((Math.sin(phase) > 0) ? 1 : -1) * Math.exp(-5 * t);
                        break;
                    case 501: // オルガン(仮)
                        wave = ((Math.sin(phase) > 0) ? 1 : -1) * 13 * t * Math.exp(-5 * t);
                        break;
                    case 502: // ギター(仮)
                        wave = 5 * Math.cos(phase + Math.cos(phase / 2) + Math.cos(phase * 2)) * Math.exp(-5 * t);
                        break;
                    default:  // 方形波
                        wave = (Math.sin(phase) > 0) ? 1 : -1;
                        break;
                }
                if (wave < -1) { wave = -1; }
                if (wave >  1) { wave =  1; }
                if (nlen2 == 0)           { fade = 1; }
                else if (i < 0.8 * nlen2) { fade = 1; }
                else if (i < nlen2)       { fade = 5 * (1 - (i / nlen2)); }
                else                      { fade = 0; }
                // this.addata[pos_int + i] += (volume / 127) * wave * fade / MMLPlayer.MAX_CH;
                this.addata[pos_int + i] += amp_c * wave * fade;
            }
        }
        // ***** 音声データ位置を計算 *****
        this.pos[ch] = this.pos[ch] + nlength1;
    };
    // ***** 休符追加(内部処理用) *****
    // MMLPlayer.prototype.addRest = function (ch, nlength1, nlength2) {
    MMLPlayer.prototype.addRest = function (ch, nlength1) {
        // ***** 音声データ位置を計算 *****
        this.pos[ch] = this.pos[ch] + nlength1;
    };
    // ***** コンパイル(内部処理用) *****
    MMLPlayer.prototype.compile = function (mml_st, pass_no) {
        var mml_st_len;     // MMLの長さ
        // ***** 全体状態 *****
        var ch;             // チャンネル選択
        var tempo;          // テンポ(1分間に演奏する4分音符の数)
        var oct_chg;        // オクターブ記号変更
        var vol_max;        // ボリューム最大値
        // ***** 各チャンネルの状態 *****
        var prog = [];      // 音色      (配列)
        var volume = [];    // 音量      (配列)
        var velocity = [];  // ベロシティ(配列)(将来用)
        var alength = [];   // 音長      (配列)
        var qtime = [];     // 発音割合  (配列)
        var octave = [];    // オクターブ(配列)
        var sharp = [];     // 調号      (2次元配列)
        var tie = [];       // タイ状態  (配列)
        var loop = [];      // ループ状態(配列)
        // ***** テンポ変更情報 *****
        var tempo_obj = {}; // テンポ変更情報格納用(連想配列オブジェクト)
        // var tempo_sort = function (a,b) { return (a.pos - b.pos); }; // ソート用(比較関数)
        // ***** その他の変数 *****
        var i, j;
        var val;
        var ret = {};       // 戻り値(連想配列オブジェクト)
        var c, c2;          // 文字
        var note, nlength1, nlength2; // 音符用
        var loop_no, loop_count;      // ループ用

        // ***** 全体状態の初期化 *****
        ch = 0;
        tempo = 120;
        oct_chg = 0;
        vol_max = 127;
        if (pass_no == 1) {
            this.tempo_chg = [];
            tempo_obj = {};
            tempo_obj.pos = 0;     // テンポ変更位置(単位は絶対音長(4分音符が48になる))
            tempo_obj.val = tempo; // テンポ変更値(1分間に演奏する4分音符の数)
            tempo_obj.rtime = 0;   // テンポ変更位置の実時間(sec)(これは後で計算する)
            // this.tempo_chg.push(tempo_obj); // これを追加するとソートでおかしくなる
        }
        // ***** 各チャンネルの状態の初期化 *****
        for (i = 0; i < MMLPlayer.MAX_CH; i++) {
            prog[i] = 0;
            volume[i] = 120;
            velocity[i] = 100;
            alength[i] = 48;
            qtime[i] = 8;
            octave[i] = 4;
            sharp[i] = [];
            for (j = 0; j < 7; j++) { // cdefgabの7個分の調号
                sharp[i][j] = 0;
            }
            tie[i] = {};
            tie[i].flag = false;  // タイのフラグ
            tie[i].note = 0;      // タイの音の高さ
            tie[i].length = 0;    // タイの音長
            loop[i] = {};
            loop[i].begin = [];   // ループ開始(配列)
            loop[i].end = [];     // ループ終了(配列)
            loop[i].counter = []; // ループ回数(配列)
            this.pos[i] = 0;      // 音声データ位置(チャンネルごと)
        }

        // ***** MMLの解析 *****
        i = 0;
        mml_st_len = mml_st.length;
        while (i < mml_st_len) {
            // ***** 1文字取り出す *****
            c = mml_st.charAt(i);
            i++;
            // ***** 音符または休符のとき *****
            if ("cdefgabr".indexOf(c) >= 0) {
                // ***** 音の高さを計算 *****
                if (c == "r") {
                    // ***** 休符は音の高さなし *****
                    note = 0;
                } else {
                    // ***** 音符の音の高さを数値化 *****
                    note = "c d ef g a b".indexOf(c);
                    // ***** オクターブを加算 *****
                    note = note + (octave[ch] + 1) * 12;
                    // ***** シャープ、フラット、ナチュラルがあるときはそれを計算 *****
                    switch (mml_st.charAt(i)) {
                        case "+": // シャープ
                        case "#": // シャープ
                            i++;
                            note++;
                            break;
                        case "-": // フラット
                            i++;
                            note--;
                            break;
                        case "=": // ナチュラル
                        case "*": // ナチュラル
                            i++;
                            break;
                        default:  // その他のときは調号の分を計算
                            val = "cdefgab".indexOf(c);
                            if (val >= 0) { note = note + sharp[ch][val]; }
                            break;
                    }
                    // ***** 音の高さ範囲チェック *****
                    if (note < 0) { note = 0; }
                    if (note > 127) { note = 127; }
                }
                // ***** 音長の計算 *****
                // ***** 絶対音長があるときは絶対音長を取得 *****
                if (mml_st.charAt(i) == "%") {
                    i++;
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    nlength1 = val;
                } else {
                    // ***** 音長があるときは音長を取得 *****
                    val = this.getValue(mml_st, i, -1, ret = {});
                    i = ret.i;
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    if (val == 0) {
                        nlength1 = 0;
                    } else if (val > 0) {
                        nlength1 = 48 * 4 / val;
                    } else {
                        nlength1 = alength[ch];
                    }
                }
                // ***** 付点があるときは音長を1.5倍 *****
                if (mml_st.charAt(i) == ".") {
                    i++;
                    nlength1 = nlength1 * 3 / 2;
                }
                // ***** 発音長の計算 *****
                nlength2 = nlength1 * qtime[ch] / 8;
                // ***** スラーの処理 *****
                if (tie[ch].flag == true && tie[ch].note != note && note > 0) {
                    // ***** 音符または休符を追加 *****
                    if (tie[ch].note > 0) {
                        // ***** 音符追加 *****
                        // _track.addNote(ch, tie[ch].note, velocity[ch], tie[ch].length, 0);
                        this.addNote(ch, tie[ch].note, tie[ch].length, 0, prog[ch], volume[ch], pass_no);
                    } else {
                        // ***** 休符追加 *****
                        // _track.addRest(ch, tie[ch].length, 0);
                        this.addRest(ch, tie[ch].length);
                    }
                    // ***** タイを解除 *****
                    tie[ch].flag = false;
                    tie[ch].note = 0;
                    tie[ch].length = 0;
                }
                // ***** タイ記号(&)の前の 空白、タブ、改行 をスキップ *****
                i = this.skipSpace(mml_st, i);
                // ***** タイまたはスラーのとき *****
                if (mml_st.charAt(i) == "&") {
                    i++;
                    // ***** タイのフラグを立てて、処理は次回にまわす *****
                    tie[ch].flag = true;
                    if (note > 0) { tie[ch].note = note; }
                    tie[ch].length = tie[ch].length + nlength1;
                } else {
                    // ***** タイの処理 *****
                    if (tie[ch].flag == true) {
                        // ***** 音符を確定する *****
                        note = tie[ch].note;
                        nlength1 = tie[ch].length + nlength1;
                        nlength2 = tie[ch].length + nlength2;
                        // ***** タイを解除 *****
                        tie[ch].flag = false;
                        tie[ch].note = 0;
                        tie[ch].length = 0;
                    }
                    // ***** 音符または休符を追加 *****
                    if (note > 0) {
                        // ***** 音符追加 *****
                        // _track.addNote(ch, note, velocity[ch], nlength1, nlength2);
                        this.addNote(ch, note, nlength1, nlength2, prog[ch], volume[ch], pass_no);
                    } else {
                        // ***** 休符追加 *****
                        // _track.addRest(ch, nlength1, nlength2);
                        this.addRest(ch, nlength1);
                    }
                }
                continue;
            }
            // ***** コマンドの処理 *****
            switch (c) {
                case "!": // 拡張コマンド
                    c2 = mml_st.charAt(i);
                    switch (c2) {
                        case "c": // チャンネル切替(0-(MAX_CH-1))
                            i++;
                            val = this.getValue(mml_st, i, 0, ret = {});
                            i = ret.i;
                            if (val < 0) { val = 0; }
                            if (val > (MMLPlayer.MAX_CH - 1)) { val = MMLPlayer.MAX_CH - 1; }
                            ch = val;
                            break;
                        case "o": // オクターブ記号変更(トグル)
                            i++;
                            if (oct_chg == 0) { oct_chg = 1; } else { oct_chg = 0; }
                            break;
                        case "v": // ボリューム最大値(1-1000)
                            i++;
                            val = this.getValue(mml_st, i, 0, ret = {});
                            i = ret.i;
                            if (val < 1) { val = 1; }
                            if (val > 1000) { val = 1000; } // エラーチェック追加
                            vol_max = val;
                            break;
                        case "+": // 調号シャープ
                        case "#": // 調号シャープ
                        case "-": // 調号フラット
                        case "=": // 調号ナチュラル
                        case "*": // 調号ナチュラル
                            i++;
                            do {
                                val = "cdefgab".indexOf(mml_st.charAt(i));
                                if (val >= 0) {
                                    i++;
                                    if (c2 == "+" || c2 == "#")      { sharp[ch][val] = 1;  }
                                    else if (c2 == "-")              { sharp[ch][val] = -1; }
                                    else if (c2 == "=" || c2 == "*") { sharp[ch][val] = 0;  }
                                }
                            } while (val >= 0);
                            break;
                    }
                    break;
                case "t": // テンポ切替(20-300) → (20-1200)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 20) { val = 20; }
                    // if (val > 300) { val = 300; }
                    if (val > 1200) { val = 1200; }
                    tempo = val;
                    // _track.setTempo(ch, tempo);
                    if (pass_no == 1) {
                        tempo_obj = {};
                        tempo_obj.pos = this.pos[ch]; // テンポ変更位置(単位は絶対音長(4分音符が48になる))
                        tempo_obj.val = tempo;        // テンポ変更値(1分間に演奏する4分音符の数)
                        tempo_obj.rtime = 0;          // テンポ変更位置の実時間(sec)(これは後で計算する)
                        this.tempo_chg.push(tempo_obj);
                        // this.tempo_chg.sort(tempo_sort);
                    }
                    break;
                case "v": // チャンネル音量(0-vol_max)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > vol_max) { val = vol_max; }
                    volume[ch] = (val * 127) / vol_max; // 内部では音量は 0-127
                    // _track.setChannelVolume(ch, volume[ch]);
                    break;
                case "k": // ベロシティ(0-127)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > 127) { val = 127; }
                    velocity[ch] = val;
                    break;
                case "@": // 音色切替(0-1000)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    prog[ch] = val;
                    // _track.changeProg(ch, prog[ch]);
                    break;
                case "l": // 音長指定(0-1000)
                    // ***** 絶対音長があるときは絶対音長を取得 *****
                    if (mml_st.charAt(i) == "%") {
                        i++;
                        val = this.getValue(mml_st, i, 0, ret = {});
                        i = ret.i;
                        if (val < 0) { val = 0; }
                        if (val > 1000) { val = 1000; } // エラーチェック追加
                        alength[ch] = val;
                    } else {
                        // ***** 音長を取得 *****
                        val = this.getValue(mml_st, i, 0, ret = {});
                        i = ret.i;
                        if (val < 0) { val = 0; }
                        if (val > 1000) { val = 1000; } // エラーチェック追加
                        if (val == 0) {
                            alength[ch] = 0;
                        } else {
                            alength[ch] = 48 * 4 / val;
                        }
                    }
                    // ***** 付点があるときは音長を1.5倍 *****
                    if (mml_st.charAt(i) == ".") {
                        i++;
                        alength[ch] = alength[ch] * 3 / 2;
                    }
                    break;
                case "q": // 発音割合指定(1-8)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 1) { val = 1; }
                    if (val > 8) { val = 8; }
                    qtime[ch] = val;
                    break;
                case "o": // オクターブ指定(0-8)
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > 8) { val = 8; }
                    octave[ch] = val;
                    break;
                case "<": // オクターブ下げ(0-8)
                    if (oct_chg == 0) {
                        if (octave[ch] > 0) { octave[ch]--; }
                    } else {
                        if (octave[ch] < 8) { octave[ch]++; }
                    }
                    break;
                case ">": // オクターブ上げ(0-8)
                    if (oct_chg == 0) {
                        if (octave[ch] < 8) { octave[ch]++; }
                    } else {
                        if (octave[ch] > 0) { octave[ch]--; }
                    }
                    break;
                case "[": // ループ開始
                    // ***** ループ情報を生成 *****
                    loop[ch].begin.push(i);
                    loop[ch].end.push(0);
                    loop[ch].counter.push(-1);
                    break;
                case "]": // ループ終了
                    // ***** ループ有無のチェック *****
                    loop_no = loop[ch].begin.length - 1;
                    if (loop_no >= 0) {
                        loop_count = loop[ch].counter[loop_no];
                        // ***** ループ最終回のとき *****
                        if (loop_count == -2) {
                            // ***** ループ終了位置へジャンプ *****
                            i = loop[ch].end[loop_no];
                            // ***** ループ情報を破棄 *****
                            loop[ch].begin.pop();
                            loop[ch].end.pop();
                            loop[ch].counter.pop();
                        } else {
                            // ***** ループ初回のとき *****
                            if (loop_count == -1) {
                                // ***** ループ回数取得 *****
                                val = this.getValue(mml_st, i, 0, ret = {});
                                i = ret.i;
                                if (val < 2)   { val = 2; }
                                if (val > 100) { val = 100; } // エラーチェック追加
                                loop_count = val - 1;
                                // ***** ループ終了位置を保存 *****
                                loop[ch].end[loop_no] = i;
                            }
                            // ***** ループ先頭位置へジャンプ *****
                            i = loop[ch].begin[loop_no];
                            // ***** ループ回数を減らす *****
                            loop_count--;
                            if (loop_count <= 0) { loop_count = -2; }
                            loop[ch].counter[loop_no] = loop_count;
                        }
                    }
                    break;
                case ":": // 最終回ループ脱出
                    // ***** ループ有無のチェック *****
                    loop_no = loop[ch].begin.length - 1;
                    if (loop_no >= 0) {
                        loop_count = loop[ch].counter[loop_no];
                        // ***** ループ最終回のとき *****
                        if (loop_count == -2) {
                            // ***** ループ終了位置へジャンプ *****
                            i = loop[ch].end[loop_no];
                            // ***** ループ情報を破棄 *****
                            loop[ch].begin.pop();
                            loop[ch].end.pop();
                            loop[ch].counter.pop();
                        }
                    }
                    break;
            }
        }
        return true;
    };
    // ***** MML内の空白、タブ、改行をスキップ(内部処理用) *****
    // (最終の検索位置を返す)
    MMLPlayer.prototype.skipSpace = function (mml_st, i) {
        var c, mml_st_len;

        mml_st_len = mml_st.length;
        while (i < mml_st_len) {
            c = mml_st.charAt(i);
            if (c != " " && c != "\t" && c != "\r" && c != "\n") { break; }
            i++;
        }
        return i;
    };
    // ***** MML内の数値を取得(内部処理用) *****
    // (引数の ret には、空のオブジェクトを格納した変数を渡すこと
    //  (検索位置 i の最終位置を、ret.i に格納して返すため))
    MMLPlayer.prototype.getValue = function (mml_st, i, err_val, ret) {
        var c, start, mml_st_len;

        mml_st_len = mml_st.length;
        if (i >= mml_st_len) {
            ret.i = i;
            return err_val;
        }
        c = mml_st.charCodeAt(i);
        if (c < 0x30 || c > 0x39) {
            ret.i = i;
            return err_val;
        }
        start = i;
        i++;
        while (i < mml_st_len) {
            c = mml_st.charCodeAt(i);
            if (c < 0x30 || c > 0x39) { break; }
            i++;
        }
        ret.i = i;
        return parseInt(mml_st.substring(start, i), 10);
    };
    // ***** MMLの前処理(内部処理用) *****
    MMLPlayer.prototype.preprocess = function (mml_st) {
        var i;
        var val;
        var ret = {};    // 戻り値(連想配列オブジェクト)
        var c;           // 文字
        var start;       // 開始点
        var ch;          // チャンネル選択
        var mml_st_len;  // MMLの長さ
        var mml_ch = []; // チャンネルごとのMML(配列)

        // ***** チャンネルごとのMMLの初期化 *****
        for (i = 0; i < MMLPlayer.MAX_CH; i++) {
            mml_ch[i] = "";
        }
        // ***** MMLを小文字に変換 *****
        mml_st = mml_st.toLowerCase();
        // ***** MMLをチャンネルごとに分解 *****
        i = 0;
        ch = 0;
        start = 0;
        mml_st_len = mml_st.length;
        while (i < mml_st_len) {
            // ***** 1文字取り出す *****
            c = mml_st.charAt(i++);
            // ***** チャンネル切替のとき *****
            if (c == "!") {
                if (i < mml_st_len && mml_st.charAt(i) == "c") {
                    i++;
                    mml_ch[ch] += mml_st.substring(start, i - 2);
                    start = i - 2;
                    val = this.getValue(mml_st, i, 0, ret = {});
                    i = ret.i;
                    if (val < 0) { val = 0; }
                    if (val > (MMLPlayer.MAX_CH - 1)) { val = MMLPlayer.MAX_CH - 1; }
                    ch = val;
                    continue;
                }
            }
        }
        mml_ch[ch] += mml_st.substring(start);
        // ***** MMLを再構成(チャンネル順につなげる) *****
        mml_st = "";
        for (i = 0; i < MMLPlayer.MAX_CH; i++) {
            mml_st += mml_ch[i];
        }
        // ***** 「^」記号をタイと休符に置換 *****
        mml_st = mml_st.replace(/\^/g, "&r");
        // ***** 末尾に無効な文字列を追加(安全のため) *****
        mml_st += "||||";
        // ***** 戻り値を返す *****
        // DebugShow(mml_st + "\n");
        return mml_st;
    };
    return MMLPlayer; // これがないとクラスが動かないので注意
})();


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


