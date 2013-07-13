// This file is encoded with UTF-8 without BOM.

// sp_interpreter.js
// 2013-7-13 v1.61


// SPALM Web Interpreter
// Modified for Web Application, by H.M(Hamaya Mahama)
// The original of this program is SPALM for cell-phones.
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA


// ****************************************
//            環境依存の処理等
// ****************************************

// ***** 汎用 *****
function Alm(msg) {
    // alert(msg);
}
function Alm2(msg) {
    alert(msg);
}
function ParamCheckNG(param) {
    if (typeof (param) == "undefined") { return true; }
    if (param == null) { return true; }
    return false;
}
function DebugShow(msg) {
    document.getElementById("debug_show1").appendChild(document.createTextNode(msg));
}
function DebugShowClear() {
    document.getElementById("debug_show1").innerHTML = "";
}

// ***** 動作開始 *****
window.xcanvas = function () {
    DebugShow("uuCanvas mode.\n");
    init_func();
};
window.onload = function () {
    if (typeof (uu) == "undefined") {
        if (typeof (FlashCanvas) != "undefined") {
            DebugShow("FlashCanvas mode.\n");
        } else {
            DebugShow("Native canvas mode.\n");
        }
        init_func();
    }
};
function init_func() {
    var list_id;

    // ***** インタープリターの初期化 *****
    Interpreter.init();
    Interpreter.setrunstatcallback(show_runstat);
    // ***** プログラムリストの読み込み *****
    list_id = get_one_url_para("list");
    if (list_id == "") {
        load_listfile("list0001.txt", false);
    } else {
        if (check_id(list_id, 8)) {
            load_listfile("list" + list_id + ".txt", true);
        } else {
            Alm2("init_func:-:リストファイル指定エラー");
        }
    }
    // ***** デバッグモードの初期選択 *****
    if (get_one_url_para("debug") == "1") {
        document.getElementById("debug_chk1").checked = true;
    }
    // ***** 他の初期化があれば実行 *****
    if (typeof (init_func2) == "function") { init_func2(); }
}

// ***** URLパラメータ1個の取得 *****
function get_one_url_para(key) {
    var ret;
    var i, pos, key2, val;
    var para_st, para;

    // ***** 戻り値の初期化 *****
    ret = "";
    // ***** 引数のチェック *****
    if (ParamCheckNG(key)) { Alm("get_one_url_para:0001"); return ret; }
    if (key == "") { Alm("get_one_url_para:0002"); return ret; }
    // ***** 関数の存在チェック *****
    if (typeof (decodeURIComponent) != "function") { Alm("get_one_url_para:0003"); return ret; }
    // ***** URLパラメータ1個の取得 *****
    para_st = window.location.search.substring(1);
    para = para_st.split("&");
    for (i = 0; i < para.length; i++) {
        pos = para[i].indexOf("=");
        if (pos > 0) {
            key2 = decodeURIComponent(para[i].substring(0, pos));
            val = decodeURIComponent(para[i].substring(pos + 1));
            if (key == key2) { ret = val; break; }
        }
    }
    return ret;
}

// ***** IDチェック *****
function check_id(id, num) {
    var ret;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (ParamCheckNG(id)) { Alm("check_id:0001"); return ret; }
    if (ParamCheckNG(num)) { Alm("check_id:0002"); return ret; }
    // ***** IDのチェック *****
    if (id.length <= 0 || id.length > num) { return ret; }
    if (!id.match(/^[0-9]+$/)) { return ret; }
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** プログラムID(複数)の取得 *****
function get_prog_id(list_st) {
    var i, ch, ch2;
    var list_len;
    var prog_id = [];
    var prog_id_count;
    var split_flag;

    // ***** 戻り値の初期化 *****
    prog_id_count = 0;
    prog_id[prog_id_count] = "";
    // ***** 引数のチェック *****
    if (ParamCheckNG(list_st)) { Alm("get_prog_id:0001"); return prog_id; }
    if (list_st == "") { Alm("get_prog_id:0002"); return prog_id; }
    // ***** テキストの分解 *****
    split_flag = false;
    list_len = list_st.length;
    i = 0;
    while (i < list_len) {
        // ***** 1文字取り出す *****
        ch = list_st.charAt(i++);
        ch2 = list_st.charAt(i);
        // ***** 空白かTABのとき *****
        if (ch == " " || ch == "\t") { split_flag = true; }
        // ***** 改行のとき *****
        if (ch == "\r" && ch2 == "\n") { i++; split_flag = true; }
        if (ch == "\r" || ch == "\n") { split_flag = true; }
        // ***** コメント「;」のとき *****
        if (ch == ";") {
            while (i < list_len) {
                ch = list_st.charAt(i++);
                ch2 = list_st.charAt(i);
                if (ch == "\r" && ch2 == "\n") { i++; break; }
                if (ch == "\r" || ch == "\n") { break; }
            }
            split_flag = true;
        }
        // ***** プログラムIDの取得 *****
        if (split_flag == true) {
            split_flag = false;
            if (prog_id[prog_id_count].length > 0) {
                prog_id_count++;
                prog_id[prog_id_count] = "";
            }
        } else {
            prog_id[prog_id_count] += ch;
        }
    }
    // ***** 戻り値を返す *****
    return prog_id;
}

// ***** リストファイルの読み込み *****
function load_listfile(fname, error_show_flag) {
    var ret;
    var http_obj;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (ParamCheckNG(fname)) { Alm("load_listfile:0001"); return ret; }
    if (ParamCheckNG(error_show_flag)) { Alm("load_listfile:0002"); return ret; }
    // ***** 要素の存在チェック *****
    if (!document.getElementById("prog_sel1")) { Alm("load_listfile:0003"); return ret; }
    // ***** ファイルの読み込み *****
    http_obj = createXMLHttpObject();
    if (!http_obj) {
        if (error_show_flag) { Alm2("load_listfile:-:リストファイル読み込みエラー"); }
        return ret;
    }
    http_obj.onreadystatechange = function () {
        var i, list_st, prog_id, elm;
        // ***** IE8対策 *****
        // if (http_obj.readyState == 4 && http_obj.status == 200) {
        if (http_obj.readyState == 4) {
            if (http_obj.status == 200 || http_obj.status == 0) {
                list_st = http_obj.responseText;
                if (list_st) {
                    // ***** プログラムID(複数)の取得 *****
                    prog_id = get_prog_id(list_st);
                    // ***** プログラムリストに追加 *****
                    elm = document.getElementById("prog_sel1");
                    elm.length = 0;
                    for (i = 0; i < prog_id.length; i++) {
                        if (check_id(prog_id[i], 8)) {
                            elm.length++;
                            elm.options[elm.length - 1].value = prog_id[i];
                            elm.options[elm.length - 1].text  = prog_id[i];
                        }
                    }
                } else {
                    if (error_show_flag) { Alm2("load_listfile:+:リストファイル読み込みエラー"); }
                }
            } else {
                if (error_show_flag) { Alm2("load_listfile:*:リストファイル読み込みエラー"); }
            }
        }
    };
    http_obj.open("GET", fname, true);
    // HTTP/1.0 における汎用のヘッダフィールド
    http_obj.setRequestHeader("Pragma", "no-cache");
    // HTTP/1.1 におけるキャッシュ制御のヘッダフィールド
    http_obj.setRequestHeader("Cache-Control", "no-cache");
    // 指定日時以降に更新があれば内容を返し、更新がなければ304ステータスを返す
    // ヘッダフィールド。古い日時を指定すれば、必ず内容を返す。
    http_obj.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
    // ***** IE8対策 *****
    // http_obj.send(null);
    try { http_obj.send(null); } catch (ex) { }
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** ソースファイルの読み込み *****
function load_srcfile(fname, auto_run_flag) {
    var ret;
    var http_obj;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (ParamCheckNG(fname)) { Alm("load_srcfile:0001"); return ret; }
    if (ParamCheckNG(auto_run_flag)) { Alm("load_srcfile:0002"); return ret; }
    // ***** 要素の存在チェック *****
    if (!document.getElementById("src_text1")) { Alm("load_srcfile:0003"); return ret; }
    // ***** ロード中にする *****
    Interpreter.setloadstat(true);
    // ***** ファイルの読み込み *****
    http_obj = createXMLHttpObject();
    if (!http_obj) { Alm2("load_srcfile:-:ソースファイル読み込みエラー"); return ret; }
    http_obj.onreadystatechange = function () {
        var src_st;
        // ***** IE8対策 *****
        // if (http_obj.readyState == 4 && http_obj.status == 200) {
        if (http_obj.readyState == 4) {
            if (http_obj.status == 200 || http_obj.status == 0) {
                src_st = http_obj.responseText;
                if (src_st) {
                    // ***** ロード中を解除(ロード完了) *****
                    Interpreter.setloadstat(2);
                    // ***** テキストボックスにセット *****
                    document.getElementById("src_text1").value = src_st;
                    // ***** スクロールを先頭に移動 *****
                    if (document.getElementById("src_text1").scrollTop) {
                        document.getElementById("src_text1").scrollTop = 0;
                    }
                    // ***** 自動実行 *****
                    if (auto_run_flag) { run_button(); }
                } else {
                    Alm2("load_srcfile:+:ソースファイル読み込みエラー");
                    // ***** ロード中を解除 *****
                    Interpreter.setloadstat(false);
                }
            } else {
                Alm2("load_srcfile:*:ソースファイル読み込みエラー");
                // ***** ロード中を解除 *****
                Interpreter.setloadstat(false);
            }
        }
    };
    http_obj.open("GET", fname, true);
    // HTTP/1.0 における汎用のヘッダフィールド
    http_obj.setRequestHeader("Pragma", "no-cache");
    // HTTP/1.1 におけるキャッシュ制御のヘッダフィールド
    http_obj.setRequestHeader("Cache-Control", "no-cache");
    // 指定日時以降に更新があれば内容を返し、更新がなければ304ステータスを返す
    // ヘッダフィールド。古い日時を指定すれば、必ず内容を返す。
    http_obj.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
    // ***** IE8対策 *****
    // http_obj.send(null);
    try { http_obj.send(null); } catch (ex) { }
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** ファイル読み込み用オブジェクトの生成 *****
function createXMLHttpObject() {
    var xml_http_obj;

    // ***** IE8対策 *****
    if (window.ActiveXObject) {
        try {
            xml_http_obj = new ActiveXObject("Msxml2.XMLHTTP"); 
            return xml_http_obj;
        } catch (ex1) { }
    }
    try {
        xml_http_obj = new XMLHttpRequest();
        return xml_http_obj;
    } catch (ex2) { }
    return null;
}

// ***** プログラム実行状態の表示 *****
function show_runstat() {
    var ret;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 要素の存在チェック *****
    if (!document.getElementById("runstat_show1")) { Alm("show_runstat:0001"); return ret; }
    if (!document.getElementById("run_button1")) { Alm("show_runstat:0002"); return ret; }
    if (!document.getElementById("load_button1")) { Alm("show_runstat:0003"); return ret; }
    if (!document.getElementById("prog_sel1")) { Alm("show_runstat:0004"); return ret; }
    if (!document.getElementById("src_text1")) { Alm("show_runstat:0005"); return ret; }
    // ***** プログラム実行状態の表示 *****
    if (Interpreter.getloadstat() == true) {
        document.getElementById("runstat_show1").innerHTML = "ロード中";
    } else if (Interpreter.getloadstat() == 2) {
        document.getElementById("runstat_show1").innerHTML = "ロード完了";
    } else {
        if (Interpreter.getrunstat()) {
            document.getElementById("runstat_show1").innerHTML = "実行中";
        } else {
            document.getElementById("runstat_show1").innerHTML = "停止";
        }
    }
    // ***** ボタンの有効/無効設定 *****
    if (Interpreter.getrunstat() || Interpreter.getloadstat() == true) {
        document.getElementById("run_button1").disabled = true;
        document.getElementById("load_button1").disabled = true;
        document.getElementById("prog_sel1").disabled = true;
        document.getElementById("src_text1").disabled = true;
    } else {
        document.getElementById("run_button1").disabled = false;
        document.getElementById("load_button1").disabled = false;
        document.getElementById("prog_sel1").disabled = false;
        document.getElementById("src_text1").disabled = false;
    }
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** ロードボタン *****
function load_button() {
    var ret;
    var prog_id;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 要素の存在チェック *****
    if (!document.getElementById("prog_sel1")) { Alm("load_button:0001"); return ret; }
    // ***** 実行中のチェック *****
    if (Interpreter.getrunstat()) { Alm2("load_button:-:プログラム実行中です。停止してからロードしてください。"); return ret; }
    // ***** ロード中のチェック *****
    if (Interpreter.getloadstat()) { Alm2("load_button:-:プログラムロード中です。"); return ret; }
    // ***** ソースファイルの読み込み *****
    prog_id = document.getElementById("prog_sel1").options[document.getElementById("prog_sel1").selectedIndex].value;
    if (!check_id(prog_id, 8)) { Alm("load_button:0003"); return ret; }
    load_srcfile("prog" + prog_id + ".txt", false);
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** 実行ボタン *****
function run_button() {
    var ret;
    var src_st;
    var dbg_mode;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 要素の存在チェック *****
    if (!document.getElementById("src_text1")) { Alm("run_button:0001"); return ret; }
    if (!document.getElementById("debug_chk1")) { Alm("run_button:0002"); return ret; }
    // ***** 実行中のチェック *****
    if (Interpreter.getrunstat()) { Alm2("run_button:-:すでにプログラム実行中です。"); return ret; }
    // ***** ロード中のチェック *****
    if (Interpreter.getloadstat()) { Alm2("run_button:-:プログラムロード中です。"); return ret; }
    // ***** ソースの取得 *****
    src_st = document.getElementById("src_text1").value;
    // ***** デバッグモードの設定 *****
    if (document.getElementById("debug_chk1").checked) { dbg_mode = 1; } else { dbg_mode = 0; }
    Interpreter.setdebug(dbg_mode);
    // ***** 実行 *****
    Interpreter.run(src_st);
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** 停止ボタン *****
function stop_button() {
    // ***** 停止 *****
    Interpreter.stop();
}


// ****************************************
//          インタープリター部分
// ****************************************

// ***** インタープリター(名前空間) *****
//
// 公開I/F :
//
//   Interpreter.init()        初期化
//
//   Interpreter.run(src_st)   実行
//     src_st  プログラムのソース
//
//   Interpreter.stop()        停止
//
//   Interpreter.getrunstat()  実行状態取得
//     戻り値  =true:実行中,=false:停止
//
//   Interpreter.setrunstatcallback(cb_func)  実行状態通知
//     cb_func コールバック関数(状態変化時に呼ばれる関数を指定する)
//
//   Interpreter.setloadstat(load_stat)  ロード中状態設定
//     load_stat  =true:ロード中,=false:非ロード中,=2:ロード完了
//
//   Interpreter.getloadstat()  ロード中状態取得
//     戻り値  =true:ロード中,=false:非ロード中,=2:ロード完了
//
//   Interpreter.setdebug(dbg_mode)  デバッグ用
//     dbg_mode  =0:通常モード,=1:デバッグモード
//
//   Interpreter.setcolor(can1_forecolor, can1_backcolor, can2_forecolor, can2_backcolor)  色設定
//     can1_forecolor  Canvasの文字色を文字列で指定する("#ffffff" 等。""なら設定しない)
//     can1_backcolor  Canvasの背景色を文字列で指定する("#707070" 等。""なら設定しない)
//     can2_forecolor  ソフトキー表示エリアの文字色を文字列で指定する("#ffffff" 等。""なら設定しない)
//     can2_backcolor  ソフトキー表示エリアの背景色を文字列で指定する("#707070" 等。""なら設定しない)
//
// その他 情報等 :
//
//   新しい命令の追加は、
//     statement_addfunc()  (戻り値のない関数のとき)
//     factor_addfunc()     (戻り値のある関数のとき)
//   の中で行うことを想定しています。
//
//   内部クラス一覧
//     Var         変数用クラス
//
//   外部クラス一覧
//     ConvZenHan  文字列の全角半角変換用クラス(staticクラス)
//     FloodFill   領域塗りつぶし用クラス
//     Missile     ミサイル用クラス
//     MMLPlayer   MML音楽演奏用クラス
//
var Interpreter;
(function (Interpreter) {
    var max_array_size = 10000; // 処理する配列の個数最大値
    var max_str_size = 10000;   // 処理する文字数最大値
    var max_image_size = 4000;  // 画像の縦横のサイズ最大値(px)
    var max_scale_size = 1000;  // 座標系の倍率最大値

    var can1;                   // Canvas要素
    var ctx1;                   // Canvasのコンテキスト
    var can1_width_init = 240;  // Canvasの幅(px)の初期値
    var can1_height_init = 320; // Canvasの高さ(px)の初期値
    var can1_forecolor_init = "#ffffff"; // Canvasの文字色の初期値
    var can1_backcolor_init = "#707070"; // Canvasの背景色の初期値
    var can2;                   // ソフトキー表示エリアのCanvas要素
    var ctx2;                   // ソフトキー表示エリアのCanvasのコンテキスト
    var can2_width_init = 240;  // ソフトキー表示エリアの幅(px)
    var can2_height_init = 18;  // ソフトキー表示エリアの高さ(px)
    var can2_forecolor_init = "#ffffff"; // ソフトキー表示エリアの文字色の初期値
    var can2_backcolor_init = "#707070"; // ソフトキー表示エリアの背景色の初期値
    var can;                    // 現在の描画先のCanvas要素
    var ctx;                    // 現在の描画先のCanvasコンテキスト
    var ctx_originx;            // 座標系の原点座標X(px)
    var ctx_originy;            // 座標系の原点座標Y(px)
    var ctx_rotate;             // 座標系の回転の角度(rad)
    var ctx_rotateox;           // 座標系の回転の中心座標X(px)
    var ctx_rotateoy;           // 座標系の回転の中心座標Y(px)
    var ctx_scalex;             // 座標系の拡大縮小のX方向倍率
    var ctx_scaley;             // 座標系の拡大縮小のY方向倍率
    var ctx_scaleox;            // 座標系の拡大縮小の中心座標X(px)
    var ctx_scaleoy;            // 座標系の拡大縮小の中心座標Y(px)
    var font_size;              // フォントサイズ(px)
    var color_val;              // 色設定
    var line_width;             // 線の幅(px)
    // ***** FlashCanvas Pro (将来用) で monospace が横長のフォントになるので削除 *****
    // var font_family = "'MS Gothic', Osaka-Mono, monospace"; // フォント指定
    var font_family = "'MS Gothic', Osaka-Mono"; // フォント指定

    var src;                    // ソース
    var symbol = [];            // シンボル               (配列)
    var symbol_line = [];       // シンボルが何行目か     (配列)
    var symbol_len = 0;         // シンボル数             (高速化のために導入 → あまり効果なかったが...)
    var symbol2 = [];           // コンパイル用シンボル   (配列)
    var symbol2_line = [];      // コンパイル用シンボルが何行目か(配列)
    var symbol2_len = 0;        // コンパイル用シンボル数 (高速化のために導入 → あまり効果なかったが...)
    var vars = {};              // 変数用                 (Varsクラスのインスタンス)
    var imgvars = {};           // 画像変数用             (連想配列オブジェクト)
    var stimg = {};             // 画像文字割付用         (連想配列オブジェクト)
    var missile = {};           // ミサイル用             (連想配列オブジェクト)
    var audplayer = {};         // 音楽再生用             (連想配列オブジェクト)
    var label = {};             // ラベル用               (連想配列オブジェクト)
    var func = {};              // 関数用                 (連想配列オブジェクト)

    var pc;                     // プログラムカウンタ
    var debugpc;                // エラーの場所
    var stop_flag;              // 停止フラグ
    var end_flag;               // 終了フラグ
    var running_flag = false;   // 実行中フラグ
    var loading_flag = false;   // ロード中フラグ
    var debug_mode = 0;         // デバッグモード(=0:通常モード,=1:デバッグモード)

    var sleep_flag;             // スリープ用のフラグ
    var sleep_time;             // スリープ時間(msec)
    var sleep_id = null;        // スリープキャンセル用ID
    var loop_time_max = 3000;   // 最大ループ時間(msec) これ以上時間がかかったらエラーとする
    var loop_time_start;        // ループ開始時間(msec)
    var loop_time_count;        // ループ経過時間(msec)
    var dlg_flag;               // ダイアログ用のフラグ
    var audmake_flag;           // 音楽生成用フラグ
    var return_flag;            // return用のフラグ
    var ret_num;                // returnの戻り値
    var nest;                   // ネストのカウント
    var funccall_stack = [];    // 関数呼び出し情報保存用(配列)
    var gosub_back = [];        // gosubの戻り先(配列)

    var key_press_code;         // キープレスコード
    var key_down_code;          // キーダウンコード
    var key_down_stat = {};     // キーダウン状態(キーごと)     (連想配列オブジェクト)
    var input_buf = [];         // キー入力バッファ1(携帯互換用)(配列)
    var keyinput_buf = [];      // キー入力バッファ2(PC用)      (配列)
    var softkey = [];           // ソフトキー表示               (配列)

    var mousex;                 // マウスX座標(px)
    var mousey;                 // マウスY座標(px)
    var mouse_btn_stat = {};    // マウスボタン状態(ボタンごと)(連想配列オブジェクト)

    var sp_compati_mode;        // 互換モード(=0:通常モード,=1:互換モード)
    var use_local_vars;         // ローカル変数使用有無
    var use_addfunc;            // 追加命令使用有無
    var save_data = {};         // セーブデータ(連想配列オブジェクト)(仮)
    var aud_mode;               // 音楽モード(=0:音楽なし,=1:音楽あり,=2:音楽演奏機能有無による)

    var constants = { LEFT:4, HCENTER:1, RIGHT:8, TOP:16, VCENTER:2, BASELINE:64, BOTTOM:32,
        key0:1, key1:2, key2:4, key3:8, key4:16, key5:32, key6:64, key7:128, key8:256, key9:512,
        keystar:1024, keysharp:2048, keyup:4096, keyleft:8192, keyright:16384, keydown:32768,
        keyselect:65536, keysoft1:131072, keysoft2:262144,
        red:0xff0000, green:0x8000, blue:0xff, aqua:0xffff, yellow:0xffff00, gray:0x808080,
        white:0xffffff, black:0, navy:0x80, teal:0x8080, maroon:0x800000, purple:0x800080,
        olive:0x808000, silver:0xc0c0c0, lime:0xff00, fuchsia:0xff00ff };
                                // 定数

    // ***** 初期化 *****
    function init() {
        var ret;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** Canvasの初期化 *****
        can1 = document.getElementById("canvas1");
        if (!can1 || !can1.getContext) { Alm2("Interpreter.init:-:描画機能が利用できません。"); return ret; }
        // ctx1 = can1.getContext("2d");
        can2 = document.getElementById("canvas2");
        if (!can2 || !can2.getContext) { Alm2("Interpreter.init:+:描画機能が利用できません。"); return ret; }
        // ctx2 = can2.getContext("2d");
        // ***** キーボードイベント登録 *****
        if (document.addEventListener) {
            document.addEventListener("keydown",  keydown,  false);
            document.addEventListener("keyup",    keyup,    false);
            document.addEventListener("keypress", keypress, false);
        } else if (document.attachEvent) {
            // ***** IE8対策 *****
            document.attachEvent("onkeydown",  keydown);
            document.attachEvent("onkeyup",    keyup);
            document.attachEvent("onkeypress", keypress);
        } else {
            Alm2("Interpreter.init:-:キーボードの状態が取得できません。");
        }
        // ***** マウスイベント登録 *****
        if (document.addEventListener) {
            document.addEventListener("mousedown",   mousedown,   false);
            document.addEventListener("mouseup",     mouseup,     false);
            document.addEventListener("mousemove",   mousemove,   false);
            document.addEventListener("mouseout",    mouseout,    false);
            // document.addEventListener("contextmenu", contextmenu, false);
        } else if (document.attachEvent) {
            // ***** IE8対策 *****
            document.attachEvent("onmousedown",   mousedown);
            document.attachEvent("onmouseup",     mouseup);
            document.attachEvent("onmousemove",   mousemove);
            document.attachEvent("onmouseout",    mouseout);
            // document.attachEvent("oncontextmenu", contextmenu);
        } else {
            Alm2("Interpreter.init:-:マウスの状態が取得できません。");
        }
        // ***** Canvas内のマウスイベント登録 *****
        if (can1.addEventListener) {
            can1.addEventListener("mousedown",   mousedown_canvas,   false);
            can1.addEventListener("contextmenu", contextmenu_canvas, false);
        } else if (can1.attachEvent) {
            // ***** IE8対策 *****
            can1.attachEvent("onmousedown",   mousedown_canvas);
            can1.attachEvent("oncontextmenu", contextmenu_canvas);
        } else {
            Alm2("Interpreter.init:-:Canvas内のマウスの状態が取得できません。");
        }
        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }
    Interpreter.init = init;

    // ***** 実行 *****
    function run(src_st) {
        var ret;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** 引数のチェック *****
        if (ParamCheckNG(src_st)) { Alm2("Interpreter.run:-:ソースがありません。"); return ret; }
        // ***** ソース設定 *****
        src = src_st;
        // ***** 実行開始 *****
        run_start();
        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }
    Interpreter.run = run;

    // ***** 停止 *****
    function stop() {
        stop_flag = true;
        if (sleep_id != null) {
            clearTimeout(sleep_id);
            run_continuously();
        }
    }
    Interpreter.stop = stop;

    // ***** 実行状態取得 *****
    function getrunstat() {
        return running_flag;
    }
    Interpreter.getrunstat = getrunstat;

    // ***** 実行状態通知 *****
    var runstatchanged = function () { };
    function setrunstatcallback(cb_func) {
        if (ParamCheckNG(cb_func)) { Alm("Interpreter.setrunstatcallback:0001"); return false; }
        if (typeof (cb_func) == "function") { runstatchanged = cb_func; }
    }
    Interpreter.setrunstatcallback = setrunstatcallback;

    // ***** ロード中状態設定 *****
    function setloadstat(load_stat) {
        if (ParamCheckNG(load_stat)) { Alm("Interpreter.setloadstat:0001"); return false; }
        loading_flag = load_stat;
        runstatchanged();
        if (loading_flag == 2) { loading_flag = false; }
    }
    Interpreter.setloadstat = setloadstat;

    // ***** ロード中状態取得 *****
    function getloadstat() {
        return loading_flag;
    }
    Interpreter.getloadstat = getloadstat;

    // ***** デバッグ用 *****
    function setdebug(dbg_mode) {
        if (ParamCheckNG(dbg_mode)) { Alm("Interpreter.setdebug:0001"); return false; }
        debug_mode = dbg_mode;
    }
    Interpreter.setdebug = setdebug;

    // ***** 色設定 *****
    function setcolor(can1_forecolor, can1_backcolor, can2_forecolor, can2_backcolor) {
        if (ParamCheckNG(can1_forecolor)) { Alm("Interpreter.setcolor:0001"); return false; }
        if (ParamCheckNG(can1_backcolor)) { Alm("Interpreter.setcolor:0002"); return false; }
        if (ParamCheckNG(can2_forecolor)) { Alm("Interpreter.setcolor:0003"); return false; }
        if (ParamCheckNG(can2_backcolor)) { Alm("Interpreter.setcolor:0004"); return false; }
        if (can1_forecolor != "") { can1_forecolor_init = can1_forecolor; }
        if (can1_backcolor != "") { can1_backcolor_init = can1_backcolor; }
        if (can2_forecolor != "") { can2_forecolor_init = can2_forecolor; }
        if (can2_backcolor != "") { can2_backcolor_init = can2_backcolor; }
    }
    Interpreter.setcolor = setcolor;

    // ***** 公開I/Fはここまで *****

    // ***** 以下は内部処理用 *****

    // ***** 変数用クラス *****
    var Vars = (function () {
        // ***** コンストラクタ *****
        function Vars() {
            this.globalvars = {};     // グローバル変数(連想配列オブジェクト)
            this.localvars = null;    // ローカル変数(nullまたは連想配列オブジェクト)
            this.old_vars_stack = []; // ローカル変数のスコープ保存用(配列)
        }
        // ***** ローカル変数のスコープを1個生成する *****
        Vars.prototype.makeLocalScope = function () {
            var localvars = {};
            if (this.localvars != null) {
                this.old_vars_stack.push(this.localvars);
            }
            this.localvars = localvars;
        };
        // ***** ローカル変数のスコープを1個解放する *****
        Vars.prototype.deleteLocalScope = function () {
            if (this.old_vars_stack.length > 0) {
                this.localvars = this.old_vars_stack.pop();
            } else {
                this.localvars = null;
            }
        };
        // ***** 全変数を削除する *****
        Vars.prototype.clearVars = function () {
            var i;
            this.globalvars = {};
            if (this.localvars != null) {
                this.localvars = {};
            }
            for (i = 0; i < this.old_vars_stack.length; i++) {
                this.old_vars_stack[i] = {};
            }
        };
        // ***** 変数を削除する *****
        Vars.prototype.deleteVar = function (var_name) {
            var i;
            var glb, loc;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                if (!this.globalvars.hasOwnProperty(var_name)) { return true; }
                delete this.globalvars[var_name];
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                if (!localvars.hasOwnProperty(var_name)) { return true; }
                delete localvars[var_name];
                return true;
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            if (localvars.hasOwnProperty(var_name)) {
                delete localvars[var_name];
                return true;
            }
            // グローバル変数が存在する
            if (this.globalvars.hasOwnProperty(var_name)) {
                delete this.globalvars[var_name];
                return true;
            }
            // ローカル変数もグローバル変数も存在しない
            return true;
        };
        // ***** 変数の存在チェック *****
        Vars.prototype.checkVar = function (var_name) {
            var i;
            var glb, loc;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                if (!this.globalvars.hasOwnProperty(var_name)) { return false; }
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                if (!localvars.hasOwnProperty(var_name)) { return false; }
                return true;
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            if (localvars.hasOwnProperty(var_name)) {
                return true;
            }
            // グローバル変数が存在する
            if (this.globalvars.hasOwnProperty(var_name)) {
                return true;
            }
            // ローカル変数もグローバル変数も存在しない
            return false;
        };
        // ***** 変数の値を取得する *****
        Vars.prototype.getVarValue = function (var_name) {
            var i;
            var array_name;
            var var_name2;
            var glb, loc;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                if (!this.globalvars.hasOwnProperty(var_name)) { this.globalvars[var_name] = 0; }
                return this.globalvars[var_name];
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                if (!localvars.hasOwnProperty(var_name)) { localvars[var_name] = 0; }
                return localvars[var_name];
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            if (localvars.hasOwnProperty(var_name)) {
                return localvars[var_name];
            }
            // グローバル変数が存在する
            if (this.globalvars.hasOwnProperty(var_name)) {
                return this.globalvars[var_name];
            }
            // ローカル変数もグローバル変数も存在しない
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                array_name = var_name.substring(0, i);
                for (var_name2 in this.globalvars) {
                    if (this.globalvars.hasOwnProperty(var_name2)) {
                        // 配列のグローバル変数が存在する(番号は異なる)
                        if (var_name2.substring(0, i) == array_name) {
                            this.globalvars[var_name] = 0;
                            return this.globalvars[var_name];
                        }
                    }
                }
            }
            localvars[var_name] = 0;
            return localvars[var_name];
        };
        // ***** 変数の値を設定する *****
        Vars.prototype.setVarValue = function (var_name, var_value) {
            var i;
            var array_name;
            var var_name2;
            var glb, loc;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                this.globalvars[var_name] = var_value;
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                localvars[var_name] = var_value;
                return true;
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            if (localvars.hasOwnProperty(var_name)) {
                localvars[var_name] = var_value;
                return true;
            }
            // グローバル変数が存在する
            if (this.globalvars.hasOwnProperty(var_name)) {
                this.globalvars[var_name] = var_value;
                return true;
            }
            // ローカル変数もグローバル変数も存在しない
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                array_name = var_name.substring(0, i);
                for (var_name2 in this.globalvars) {
                    if (this.globalvars.hasOwnProperty(var_name2)) {
                        // 配列のグローバル変数が存在する(番号は異なる)
                        if (var_name2.substring(0, i) == array_name) {
                            this.globalvars[var_name] = var_value;
                            return true;
                        }
                    }
                }
            }
            localvars[var_name] = var_value;
            return true;
        };
        // ***** 配列変数の一括コピー *****
        Vars.prototype.copyArray = function (var_name, var_name2) {
            var i;
            var glb, loc;
            var var_name_len;
            var var_name_from;
            var var_name_to;
            var copy_flag;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }
            if (var_name2 == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** 変数に[を付加 *****
            var_name = var_name + "[";
            var_name2 = var_name2 + "[";
            // ***** 変数の長さを取得 *****
            var_name_len = var_name.length;
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                for (var_name_from in this.globalvars) {
                    if (this.globalvars.hasOwnProperty(var_name_from)) {
                        if (var_name_from.substring(0, var_name_len) == var_name) {
                            var_name_to = var_name2 + var_name_from.substring(var_name_len);
                            this.setVarValue(var_name_to, this.getVarValue(var_name_from));
                        }
                    }
                }
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                for (var_name_from in localvars) {
                    if (localvars.hasOwnProperty(var_name_from)) {
                        if (var_name_from.substring(0, var_name_len) == var_name) {
                            var_name_to = var_name2 + var_name_from.substring(var_name_len);
                            this.setVarValue(var_name_to, this.getVarValue(var_name_from));
                        }
                    }
                }
                return true;
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            copy_flag = false;
            for (var_name_from in localvars) {
                if (localvars.hasOwnProperty(var_name_from)) {
                    if (var_name_from.substring(0, var_name_len) == var_name) {
                        var_name_to = var_name2 + var_name_from.substring(var_name_len);
                        this.setVarValue(var_name_to, this.getVarValue(var_name_from));
                        copy_flag = true;
                    }
                }
            }
            if (copy_flag) { return true; }
            // グローバル変数が存在する
            copy_flag = false;
            for (var_name_from in this.globalvars) {
                if (this.globalvars.hasOwnProperty(var_name_from)) {
                    if (var_name_from.substring(0, var_name_len) == var_name) {
                        var_name_to = var_name2 + var_name_from.substring(var_name_len);
                        this.setVarValue(var_name_to, this.getVarValue(var_name_from));
                        copy_flag = true;
                    }
                }
            }
            if (copy_flag) { return true; }
            // ローカル変数もグローバル変数も存在しない
            return true;
        };
        // ***** 配列変数の一括削除 *****
        Vars.prototype.deleteArray = function (var_name) {
            var i;
            var glb, loc;
            var var_name_len;
            var var_name2;
            var delete_flag;
            var localvars;

            // ***** 引数のチェック *****
            if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の先頭の「a\」の数だけスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                i = 0; do { i++; var_name = var_name.substring(2); } while (var_name.substring(0, 2) == "a\\");
                if (this.old_vars_stack.length >= i) { localvars = this.old_vars_stack[this.old_vars_stack.length - i]; }
                else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 7) == "global ") { glb = true; var_name = var_name.substring(7); }
            if (var_name.substring(0, 4) == "glb "   ) { glb = true; var_name = var_name.substring(4); }
            if (var_name.substring(0, 6) == "local " ) { loc = true; var_name = var_name.substring(6); }
            if (var_name.substring(0, 4) == "loc "   ) { loc = true; var_name = var_name.substring(4); }
            // ***** 変数に[を付加 *****
            var_name = var_name + "[";
            // ***** 変数の長さを取得 *****
            var_name_len = var_name.length;
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                for (var_name2 in this.globalvars) {
                    if (this.globalvars.hasOwnProperty(var_name2)) {
                        if (var_name2.substring(0, var_name_len) == var_name) {
                            delete this.globalvars[var_name2];
                        }
                    }
                }
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                for (var_name2 in localvars) {
                    if (localvars.hasOwnProperty(var_name2)) {
                        if (var_name2.substring(0, var_name_len) == var_name) {
                            delete localvars[var_name2];
                        }
                    }
                }
                return true;
            }
            // ***** グローバル変数とローカル変数を両方使うとき *****
            // ローカル変数が存在する
            delete_flag = false;
            for (var_name2 in localvars) {
                if (localvars.hasOwnProperty(var_name2)) {
                    if (var_name2.substring(0, var_name_len) == var_name) {
                        delete localvars[var_name2];
                        delete_flag = true;
                    }
                }
            }
            if (delete_flag) { return true; }
            // グローバル変数が存在する
            delete_flag = false;
            for (var_name2 in this.globalvars) {
                if (this.globalvars.hasOwnProperty(var_name2)) {
                    if (var_name2.substring(0, var_name_len) == var_name) {
                        delete this.globalvars[var_name2];
                        delete_flag = true;
                    }
                }
            }
            if (delete_flag) { return true; }
            // ローカル変数もグローバル変数も存在しない
            return true;
        };
        return Vars; // これがないとクラスが動かないので注意
    })();

    // ***** キーボード処理 *****
    function keydown(ev) {
        var num;
        // ***** IE8対策 *****
        ev = ev || window.event;
        // ***** キーダウン *****
        key_down_stat[ev.keyCode] = true;
        key_down_code = ev.keyCode;
        // ***** プログラムの実行中は ブラウザのスクロール等を抑制する *****
        if (running_flag) {
            // ***** スペース/矢印/PageUp/PageDown/Home/Endキーを無効化 *****
            if (key_down_code >= 32 && key_down_code <= 40) {
                // ***** IE8対策 *****
                if (ev.preventDefault) {
                    ev.preventDefault();
                } else {
                    ev.returnValue = false;
                }
            }
        }
        // ***** キー入力バッファ1に追加 *****
        num = 0;
        // [0]-[9] (テンキーも含める)
        if (key_down_code == 48 || key_down_code == 96 ) { num = 1; }
        if (key_down_code == 49 || key_down_code == 97 ) { num = (1 << 1); }
        if (key_down_code == 50 || key_down_code == 98 ) { num = (1 << 2); }
        if (key_down_code == 51 || key_down_code == 99 ) { num = (1 << 3); }
        if (key_down_code == 52 || key_down_code == 100) { num = (1 << 4); }
        if (key_down_code == 53 || key_down_code == 101) { num = (1 << 5); }
        if (key_down_code == 54 || key_down_code == 102) { num = (1 << 6); }
        if (key_down_code == 55 || key_down_code == 103) { num = (1 << 7); }
        if (key_down_code == 56 || key_down_code == 104) { num = (1 << 8); }
        if (key_down_code == 57 || key_down_code == 105) { num = (1 << 9); }
        // [*][#] は [z][x] にする
        if (key_down_code == 90) { num = (1 << 10); }
        if (key_down_code == 88) { num = (1 << 11); }
        // [←][↑][→][↓]
        if (key_down_code == 37) { num = (1 << 13); } // 12でないので注意
        if (key_down_code == 38) { num = (1 << 12); } // 13でないので注意
        if (key_down_code == 39) { num = (1 << 14); }
        if (key_down_code == 40) { num = (1 << 15); }
        // 決定ボタン は スペースキーとEnterキーにする
        if (key_down_code == 32 || key_down_code == 13) { num = (1 << 16); }
        // [Soft1][Soft2] は [c][v]にする
        if (key_down_code == 67) { num = (1 << 17); }
        if (key_down_code == 86) { num = (1 << 18); }
        if (num > 0) {
            if (input_buf.length >= 40) { input_buf.shift(); }
            input_buf.push(num);
        }
        // ***** スペースキーのとき *****
        // スペースキーを上で無効化したためkeypressが発生しないので、ここで処理する
        if (key_down_code == 32) {
            key_press_code = 32;
            // ***** キー入力バッファ2に追加 *****
            if (keyinput_buf.length >= 40) { keyinput_buf.shift(); }
            keyinput_buf.push(key_press_code);
        }
    }
    function keyup(ev) {
        // ***** IE8対策 *****
        ev = ev || window.event;
        // ***** キーアップ *****
        key_down_stat[ev.keyCode] = false;
        key_down_code = 0;
        key_press_code = 0;
    }
    function keypress(ev) {
        // ***** IE8対策 *****
        ev = ev || window.event;
        // ***** キープレス *****
        key_press_code = ev.keyCode;
        // ***** キー入力バッファ2に追加 *****
        if (keyinput_buf.length >= 40) { keyinput_buf.shift(); }
        keyinput_buf.push(key_press_code);
    }
    // ダイアログを表示するとkeyupが発生しないことがあるので、
    // この関数を呼んでクリア可能とする
    function keyclear() {
        var key_code;
        // ***** すべてのキー状態をクリア *****
        for (key_code in key_down_stat) {
            if (key_down_stat.hasOwnProperty(key_code)) {
                key_down_stat[key_code] = false;
            }
        }
        key_down_code = 0;
        key_press_code = 0;
    }

    // ***** マウス処理 *****
    function mousedown(ev) {
        var num;
        // ***** マウスボタン状態を取得 *****
        num = ev.button;
        // ***** FlashCanvas用 *****
        if (typeof (FlashCanvas) != "undefined") {
            if (num == 1) { num =  0; } // 中ボタンは左ボタンに変換
            if (num == 2) { num = -1; } // 右ボタンは無効化
        }
        if (num >= 0) { mouse_btn_stat[num] = true; }
        // ***** マウス座標を取得 *****
        getmousepos(ev);
    }
    function mousedown_canvas(ev) {
        // ***** プログラムの実行中は Canvas内でのマウスの機能(領域選択等)を抑制する *****
        if (running_flag) {
            // ***** IE8対策 *****
            if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                ev.returnValue = false;
            }
        }
    }
    function mouseup(ev) {
        var num;
        // ***** マウスボタン状態を取得 *****
        num = ev.button;
        // ***** FlashCanvas用 *****
        if (typeof (FlashCanvas) != "undefined") {
            if (num == 1) { num =  0; } // 中ボタンは左ボタンに変換
            if (num == 2) { num = -1; } // 右ボタンは無効化
        }
        if (num >= 0) { mouse_btn_stat[num] = false; }
        // ***** マウス座標を取得 *****
        getmousepos(ev);
    }
    function mousemove(ev) {
        // ***** マウス座標を取得 *****
        getmousepos(ev);
    }
    function mouseout(ev) {
        // ***** すべてのマウスボタン状態をクリア *****
        mousebuttonclear();
        // ***** マウス座標を範囲外とする *****
        mousex = -10000;
        mousey = -10000;
    }
    function contextmenu_canvas(ev) {
        // ***** プログラムの実行中は Canvas内でのマウスの機能(メニュー表示等)を抑制する *****
        if (running_flag) {
            // ***** IE8対策 *****
            if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                ev.returnValue = false;
            }
        }
    }
    function getmousepos(ev) {
        var rect;
        // ***** IE8対策 *****
        // rect = ev.target.getBoundingClientRect();
        rect = can1.getBoundingClientRect();
        // ***** マウス座標を取得 *****
        mousex = ev.clientX - rect.left;
        mousey = ev.clientY - rect.top;
    }
    // マウスカーソルが画面外に出たり ダイアログを表示すると、
    // mouseupが発生しないことがあるので、
    // この関数を呼んでクリア可能とする
    function mousebuttonclear() {
        var btn_code;
        // ***** すべてのマウスボタン状態をクリア *****
        for (btn_code in mouse_btn_stat) {
            if (mouse_btn_stat.hasOwnProperty(btn_code)) {
                mouse_btn_stat[btn_code] = false;
            }
        }
    }

    // ***** 正負と小数も含めた数値チェック(-0.123等) *****
    function isFullDigit(num_st) {
        // if (num_st.match(/^[+-]?[0-9]*[\.]?[0-9]+$/)) { return true; } // 間違い
        if (num_st.match(/^[+\-]?([1-9]\d*|0)(\.\d+)?$/)) { return true; }
        return false;
    }
    // ***** 数値チェック *****
    function isDigit(ch) {
        if (ch.match(/^[0-9]+$/)) { return true; }
        return false;
    }
    // ***** アルファベットチェック *****
    function isAlpha(ch) {
        if (ch.match(/^[a-zA-Z]+$/)) { return true; }
        return false;
    }
    // ***** 16進数チェック *****
    function isHex(ch) {
        if (ch.match(/^[a-fA-F0-9]+$/)) { return true; }
        return false;
    }
    // ***** 文字チェック *****
    function match(ch) {
        if (pc >= symbol_len) {
            throw new Error("'" + ch + "' が見つかりませんでした。");
        }
        if (ch != symbol[pc]) {
            throw new Error("'" + ch + "' があるべき所に '" + symbol[pc] + "' が見つかりました。");
        }
        pc++;
    }
    function match2(ch, pc2) {
        if (pc2 >= symbol_len) {
            throw new Error("'" + ch + "' が見つかりませんでした。");
        }
        if (ch != symbol[pc2]) {
            pc = pc2;
            throw new Error("'" + ch + "' があるべき所に '" + symbol[pc2] + "' が見つかりました。");
        }
        // ***** 加算されないので注意 *****
        // pc2++;
    }

    // ***** Canvasの各設定の初期化 *****
    function init_canvas_setting(ctx) {
        // ***** フォント設定 *****
        ctx.font = font_size + "px " + font_family;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        // ***** 色設定 *****
        color_val = can1_forecolor_init;
        ctx.strokeStyle = color_val;
        ctx.fillStyle = color_val;
        // ***** 線の幅設定 *****
        line_width = 1;
        ctx.lineWidth = line_width;
        // ***** 座標系設定 *****
        ctx_originx = 0;
        ctx_originy = 0;
        ctx_rotate = 0;
        ctx_rotateox = 0;
        ctx_rotateoy = 0;
        ctx_scalex = 1;
        ctx_scaley = 1;
        ctx_scaleox = 0;
        ctx_scaleoy = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を初期化
        // ***** 現在状態を保存 *****
        ctx.save();
    }
    // ***** Canvasの各設定のリセット(各種設定もリセット) *****
    function reset_canvas_setting(ctx) {
        // ***** 前回状態に復帰 *****
        ctx.restore();
        // ***** Canvasの各設定の初期化 *****
        init_canvas_setting(ctx);
    }
    // ***** Canvasの各設定のリセット2(各種設定は保持) *****
    function reset_canvas_setting2(ctx) {
        // ***** 前回状態に復帰 *****
        ctx.restore();
        // ***** フォント設定 *****
        ctx.font = font_size + "px " + font_family;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        // ***** 色設定 *****
        ctx.strokeStyle = color_val;
        ctx.fillStyle = color_val;
        // ***** 線の幅設定 *****
        ctx.lineWidth = line_width;
        // ***** 座標系設定 *****
        ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
        set_canvas_axis(ctx);                    // 座標系を再設定
        // ***** 現在状態を再び保存 *****
        ctx.save();
    }
    // ***** Canvasの座標系の設定 *****
    // (基本的に座標系を元に戻してから呼ぶこと)
    function set_canvas_axis(ctx) {
        // (これらの変換は、記述と逆の順番で実行されるので注意)
        ctx.translate(ctx_originx, ctx_originy);     // 原点座標を移動
        ctx.translate(ctx_rotateox, ctx_rotateoy);   // 回転の中心座標を元に戻す
        ctx.rotate(ctx_rotate);                      // 回転の角度を指定
        ctx.translate(-ctx_rotateox, -ctx_rotateoy); // 回転の中心座標を移動
        ctx.translate(ctx_scaleox, ctx_scaleoy);     // 拡大縮小の中心座標を元に戻す
        ctx.scale(ctx_scalex, ctx_scaley);           // 拡大縮小の倍率を指定
        ctx.translate(-ctx_scaleox, -ctx_scaleoy);   // 拡大縮小の中心座標を移動
    }

    // ***** ソフトキー表示 *****
    function disp_softkey() {
        ctx2.fillStyle = can2_backcolor_init;
        ctx2.fillRect(0, 0, can2.width, can2.height);
        ctx2.font = "16px " + font_family;
        ctx2.fillStyle = can2_forecolor_init;
        ctx2.textAlign = "left";
        ctx2.textBaseline = "top";
        if (softkey[0] != "") {
            if (softkey[0].charAt(0) == "*") {
                ctx2.fillText(softkey[0].substring(1), 0, 2);
            } else {
                ctx2.fillText("[c]:" + softkey[0], 0, 2);
            }
        }
        ctx2.textAlign = "right";
        if (softkey[1] != "") {
            if (softkey[1].charAt(0) == "*") {
                ctx2.fillText(softkey[1].substring(1), can2.width, 2);
            } else {
                ctx2.fillText("[v]:" + softkey[1], can2.width, 2);
            }
        }
    }

    // ***** 実行開始 *****
    function run_start() {
        var ret;
        var i;
        var msg;
        var msg_count;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** Canvasのコンテキストを取得 *****
        ctx1 = can1.getContext("2d");
        ctx2 = can2.getContext("2d");
        // ***** Canvasのリサイズ *****
        can1.width = can1_width_init;
        can1.height = can1_height_init;
        can2.width = can2_width_init;
        can2.height = can2_height_init;
        can1.style.width = can1_width_init + "px";
        can1.style.height = can1_height_init + "px";
        can2.style.width = can2_width_init + "px";
        can2.style.height = can2_height_init + "px";
        // ***** Canvasの背景色設定 *****
        can1.style.backgroundColor = can1_backcolor_init;
        can2.style.backgroundColor = can2_backcolor_init;
        // ***** Canvasのクリア *****
        ctx1.clearRect(0, 0, can1.width, can1.height);
        ctx2.clearRect(0, 0, can2.width, can2.height);
        // ***** フォントサイズの初期化 *****
        font_size = 16;
        // ***** Canvasの各設定の初期化 *****
        init_canvas_setting(ctx1);
        // ***** 現在の描画先にセット *****
        can = can1;
        ctx = ctx1;
        // ***** ソフトキー表示 *****
        softkey[0] = "";
        softkey[1] = "";
        disp_softkey();
        // ***** デバッグ表示クリア *****
        DebugShowClear();
        // ***** 実行開始 *****
        DebugShow("実行開始\n");
        // ***** シンボル初期化 *****
        try {
            initsymbol();
        } catch (ex1) {
            DebugShow("symbol:pass1:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
            DebugShow("initsymbol: " + ex1.message + "\n");
            debugpc = symbol_len - 1;
            if (debugpc < 0) { debugpc = 0; }
            msg = "エラー場所: " + symbol_line[debugpc] + "行";
            DebugShow(msg + "\n");
            DebugShow("実行終了\n");
            return ret;
        }
        if (debug_mode == 1) {
            DebugShow("symbol:pass1:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
        }
        // ***** コンパイル *****
        try {
            compile();
        } catch (ex2) {
            DebugShow("symbol:pass2:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
            DebugShow("compile: " + ex2.message + ": debugpc=" + debugpc + "\n");
            msg = "エラー場所: " + symbol_line[debugpc] + "行: ";
            msg_count = 0;
            if (pc <= debugpc) { pc = debugpc + 1; } // エラーが出ない件の対策
            for (i = debugpc; i < pc; i++) {
                if ((i >= 0) && (i < symbol_len)) {
                    msg = msg + symbol[i] + " ";
                    msg_count++;
                    if (msg_count >= 100) {
                        msg += "... ";
                        break;
                    }
                }
            }
            if (pc >= symbol_len) { msg += "プログラム最後まで検索したが文が完成せず"; }
            DebugShow(msg + "\n");
            DebugShow("実行終了\n");
            return ret;
        }
        if (debug_mode == 1) {
            DebugShow("symbol:pass2:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
        }
        // ***** ラベル設定 *****
        try {
            setlabel();
        } catch (ex3) {
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("setlabel: " + ex3.message + ": debugpc=" + debugpc + "\n");
            msg = "エラー場所: " + symbol_line[debugpc] + "行: ";
            msg_count = 0;
            if (pc <= debugpc) { pc = debugpc + 1; } // エラーが出ない件の対策
            for (i = debugpc; i < pc; i++) {
                if ((i >= 0) && (i < symbol_len)) {
                    msg = msg + symbol[i] + " ";
                    msg_count++;
                    if (msg_count >= 100) {
                        msg += "... ";
                        break;
                    }
                }
            }
            if (pc >= symbol_len) { msg += "プログラム最後まで検索したが文が完成せず"; }
            DebugShow(msg + "\n");
            DebugShow("実行終了\n");
            return ret;
        }
        // ***** 実行 *****
        // vars = {};
        vars = new Vars();
        imgvars = {};
        stimg = {};
        missile = {};
        audplayer = {};
        pc = 0;
        debugpc = 0;
        stop_flag = false;
        end_flag = false;
        running_flag = true; runstatchanged();
        sleep_flag = false;
        dlg_flag = false;
        audmake_flag = false;
        return_flag = false;
        ret_num = 0;
        nest = 0;
        funccall_stack = [];
        gosub_back = [];
        key_press_code = 0;
        key_down_code = 0;
        key_down_stat = {};
        input_buf = [];
        keyinput_buf = [];
        mousex = -10000;
        mousey = -10000;
        mouse_btn_stat = {};
        sp_compati_mode = 0;
        use_local_vars = true;
        use_addfunc = true;
        save_data = {};
        aud_mode = 1;

        // run_continuously(); // 再帰的になるので別関数にした
        setTimeout(run_continuously, 10);

        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** 継続実行 *****
    function run_continuously() {
        var ret;
        var i;
        var msg;
        var msg_count;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** 継続実行 *****
        // alert(symbol_line[pc] + ":" + symbol[pc]);
        sleep_id = null;
        try {
            loop_time_start = new Date().getTime();
            while (pc < symbol_len) {
                statement();
                // DebugShow(pc + " ");
                if (dlg_flag) {
                    dlg_flag = false;
                    // ***** ダイアログ表示中は処理時間に含めない *****
                    loop_time_start = new Date().getTime();
                }
                if (audmake_flag) {
                    audmake_flag = false;
                    // ***** 音楽生成中は処理時間に含めない *****
                    loop_time_start = new Date().getTime();
                }
                loop_time_count = new Date().getTime() - loop_time_start;
                if (loop_time_count >= loop_time_max) {
                    throw new Error("処理時間オーバーです(" + loop_time_max + "msec以上ブラウザに制御が返らず)。ループ内でsleep関数の利用を検討ください。");
                }
                if (stop_flag) { break; }
                if (end_flag) { break; }
                if (sleep_flag) {
                    sleep_flag = false;
                    // ***** 継続実行(再帰的に実行) *****
                    sleep_id = setTimeout(run_continuously, sleep_time);
                    // ***** 戻り値を返す *****
                    ret = true;
                    return ret;
                }
                if (return_flag) {
                    // ***** 戻り先がない *****
                    throw new Error("予期しない return または '}' が見つかりました。");
                }
            }
            // DebugShow(pc + "\n");
        } catch (ex4) {
            DebugShow("statement: " + ex4.message + ": debugpc=" + debugpc + "\n");
            msg = "エラー場所: " + symbol_line[debugpc] + "行: ";
            msg_count = 0;
            if (pc <= debugpc) { pc = debugpc + 1; } // エラーが出ない件の対策
            for (i = debugpc; i < pc; i++) {
                if ((i >= 0) && (i < symbol_len)) {
                    msg = msg + symbol[i] + " ";
                    msg_count++;
                    if (msg_count >= 100) {
                        msg += "... ";
                        break;
                    }
                }
            }
            if (pc >= symbol_len) { msg += "プログラム最後まで検索したが文が完成せず"; }
            DebugShow(msg + "\n");
            // ***** 音楽全停止 *****
            if (typeof (audstopall) == "function") { audstopall(); }
            // ***** エラー終了 *****
            running_flag = false; runstatchanged();
            DebugShow("実行終了\n");
            DebugShow("globalvars=" + JSON.stringify(vars.globalvars) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.localvars) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            return ret;
        }
        // ***** 音楽全停止 *****
        if (typeof (audstopall) == "function") { audstopall(); }
        // ***** 終了 *****
        running_flag = false; runstatchanged();
        DebugShow("実行終了\n");
        if (debug_mode == 1) {
            DebugShow("globalvars=" + JSON.stringify(vars.globalvars) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.localvars) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
        }
        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** 文(ステートメント)の処理 *****
    function statement() {
        var i, j, k;
        var sym;
        var a1, a2, a3, a4, a5, a6, a7, a8, a9;
        var var_name;
        var lbl_name;
        var x0, y0, a, b, rad1, rad2, rx, ry;
        var col_r, col_g, col_b;
        var i_start, i_end, i_plus;

        var g_data = [];
        var col_num;
        var col_data = [];
        var trans_col_no;
        var col_no;
        var img_w, img_h;
        var img_data = {};
        var img_obj = {};

        var func_params = [];
        var funccall_info = {};
        var back_pc;
        var goto_pc;

        var addfunc_ret = {};
        var ret_addfunc;

        // ***** シンボル取り出し *****
        debugpc = pc;
        sym = symbol[pc++];
        // ***** シンボルの場合分け *****
        switch (sym.charAt(0)) {
            case "a":
                if (sym == "addfunc") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    if (a1 == 0) {
                        use_addfunc = false;
                    } else {
                        use_addfunc = true;
                    }
                    return true;
                }
                if (sym == "arc") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    if (symbol[pc] == ")") {
                        a4 = a3;
                    } else {
                        match(","); a4 = parseFloat(expression()); // H
                    }
                    match(")");
                    a = a3 / 2;  // X方向の半径
                    b = a4 / 2;  // Y方向の半径
                    x0 = a1 + a; // 中心のX座標
                    y0 = a2 + b; // 中心のY座標
                    ctx.beginPath();
                    ctx.moveTo(a + x0, y0);
                    for (i = 1; i < 100; i++) {
                        ctx.lineTo(a * Math.cos(2 * Math.PI * i / 100) + x0, b * Math.sin(2 * Math.PI * i / 100) + y0);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 で円が閉じない件の対策(中心を0.5ずらしたとき) *****
                    // ctx.fillRect(a + x0, y0, 0.5, 0.5);
                    return true;
                }
                break;

            case "c":
                if (sym == "clear") {
                    match("("); a1 = parseInt(expression(), 10); // X
                    match(","); a2 = parseInt(expression(), 10); // Y
                    match(","); a3 = parseInt(expression(), 10); // W
                    match(","); a4 = parseInt(expression(), 10); // H
                    match(")");
                    ctx.clearRect(a1, a2, a3, a4);
                    return true;
                }
                if (sym == "clearkey") {
                    match("(");
                    match(")");
                    input_buf = [];
                    keyinput_buf = [];
                    return true;
                }
                if (sym == "clearvar") {
                    match("(");
                    match(")");
                    // vars = {};
                    vars.clearVars();
                    imgvars = {};
                    stimg = {};
                    missile = {};
                    // ***** 音楽全停止 *****
                    if (typeof (audstopall) == "function") { audstopall(); }
                    return true;
                }
                if (sym == "clip") {
                    match("("); a1 = parseInt(expression(), 10); // X
                    match(","); a2 = parseInt(expression(), 10); // Y
                    match(","); a3 = parseInt(expression(), 10); // W
                    match(","); a4 = parseInt(expression(), 10); // H
                    match(")");

                    // ***** Canvasの各設定のリセット2 *****
                    reset_canvas_setting2(ctx); // clipを解除する方法がrestoreしかない

                    ctx.beginPath();
                    ctx.rect(a1, a2, a3, a4);
                    ctx.clip();
                    return true;
                }
                if (sym == "cls") {
                    match("(");
                    match(")");
                    // ***** 画面クリア *****
                    // ctx.clearRect(-ctx_originx, -ctx_originy, can.width, can.height);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    ctx.clearRect(0, 0, can.width, can.height);  // 画面クリア
                    set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "col") {
                    match("(");
                    a1 = parseInt(expression(), 10); // RGB
                    match(")");
                    col_r = (a1 & 0xff0000) >> 16; // R
                    col_g = (a1 & 0x00ff00) >> 8;  // G
                    col_b = (a1 & 0x0000ff);       // B
                    color_val = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
                    ctx.strokeStyle = color_val;
                    ctx.fillStyle = color_val;
                    return true;
                }
                if (sym == "color") {
                    match("("); a1 = parseInt(expression(), 10); // R
                    match(","); a2 = parseInt(expression(), 10); // G
                    match(","); a3 = parseInt(expression(), 10); // B
                    match(")");
                    col_r = a1;
                    col_g = a2;
                    col_b = a3;
                    color_val = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
                    ctx.strokeStyle = color_val;
                    ctx.fillStyle = color_val;
                    return true;
                }
                if (sym == "copy") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); 
                    // a3 = getvarname();
                    a3 = getvarname(2); // ポインタ対応
                    match(","); a4 = parseInt(expression(), 10);
                    match(","); a5 = parseInt(expression(), 10);
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a4 = a4 | 0;
                    a5 = a5 | 0;

                    // ***** エラーチェック *****
                    // if (a5 > max_array_size) {
                    if (!(a5 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。" + max_array_size + "以下である必要があります。");
                    }
                    if (a5 <= 0) { return true; }
                    // ***** コピー処理 *****
                    if (a1 == a3 && a2 > a4) { // 前から処理か後から処理か
                        i_start = 0;
                        i_end = a5 - 1;
                        i_plus = 1;
                    } else {
                        i_start = a5 - 1;
                        i_end = 0;
                        i_plus = -1;
                    }
                    i = i_start;
                    while (true) {

                        // // ***** 配列の存在チェック *****
                        // if (!vars.checkVar(a1 + "[" + (a2 + i) + "]")) { break; }

                        // a6 = vars[a1 + "[" + (a2 + i) + "]"];
                        a6 = vars.getVarValue(a1 + "[" + (a2 + i) + "]");
                        // vars[a3 + "[" + (a4 + i) + "]"] = a6;
                        vars.setVarValue(a3 + "[" + (a4 + i) + "]", a6);
                        i += i_plus;
                        if (i_plus > 0 && i <= i_end) { continue; }
                        if (i_plus < 0 && i >= i_end) { continue; }
                        break;
                    }
                    return true;
                }
                if (sym == "copyall") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); 
                    // a2 = getvarname();
                    a2 = getvarname(2); // ポインタ対応
                    match(")");
                    // ***** 配列変数の一括コピー *****
                    vars.copyArray(a1, a2);
                    return true;
                }
                break;

            case "d":
                if (sym == "disarray") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    if (symbol[pc] == ")") {
                        a2 = null;
                        a3 = 0;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
                            a3 = a2 - 1;
                            a2 = 0;
                        } else {
                            match(","); a3 = parseInt(expression(), 10);
                        }
                    }
                    match(")");

                    // ***** エラーチェック *****
                    // if (a2 != null && (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size)) {
                    if (!(a2 == null || (a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size))) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }

                    if (a2 == null) {
                        vars.deleteArray(a1);
                    } else {
                        for (i = a2; i <= a3; i++) {
                            // delete vars[a1 + "[" + i + "]"];
                            vars.deleteVar(a1 + "[" + i + "]");
                        }
                    }
                    return true;
                }
                if (sym == "disimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(")");
                    if (imgvars.hasOwnProperty(a1)) {
                        delete imgvars[a1];
                    }
                    // for (var prop_name in imgvars) { DebugShow(prop_name + " "); } DebugShow("\n");
                    return true;
                }
                if (sym == "disvar") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(")");
                    // delete vars[a1];
                    vars.deleteVar(a1);
                    return true;
                }
                if (sym == "download") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    window.location.href = "data:application/octet-stream," + encodeURIComponent(a1);
                    return true;
                }
                if (sym == "drawarea") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10); // 先X
                    match(","); a3 = parseInt(expression(), 10); // 先Y
                    match(","); a4 = parseInt(expression(), 10); // 元X
                    match(","); a5 = parseInt(expression(), 10); // 元Y
                    match(","); a6 = parseInt(expression(), 10); // W
                    match(","); a7 = parseInt(expression(), 10); // H
                    match(")");
                    if (a1 == "screen") {
                        // ***** 画像を描画(表示画面→ターゲット) *****
                        ctx.drawImage(can1, a4, a5, a6, a7, a2, a3, a6, a7);
                    } else {
                        if (imgvars.hasOwnProperty(a1)) {
                            // ***** 画像を描画(画像変数→ターゲット) *****
                            ctx.drawImage(imgvars[a1].can, a4, a5, a6, a7, a2, a3, a6, a7);
                        } else {
                            throw new Error("Image「" + a1 + "」がロードされてません。");
                        }
                    }
                    return true;
                }
                if (sym == "drawimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10); // X
                    match(","); a3 = parseInt(expression(), 10); // Y
                    match(","); a4 = parseInt(expression(), 10); // アンカー
                    match(")");
                    if (a1 == "screen") {
                        // ***** 水平方向 *****
                        if (a4 & 4) { }                                  // 左
                        else if (a4 & 8)  { a2 = a2 - can1.width; }      // 右
                        else if (a4 & 1)  { a2 = a2 - can1.width / 2; }  // 中央
                        else { }
                        // ***** 垂直方向 *****
                        if (a4 & 16) { }                                 // 上
                        else if (a4 & 32) { a3 = a3 - can1.height; }     // 下
                        else if (a4 & 2)  { a3 = a3 - can1.height / 2; } // 中央
                        else { }
                        // ***** 画像を描画(表示画面→ターゲット) *****
                        ctx.drawImage(can1, a2, a3);
                    } else {
                        if (imgvars.hasOwnProperty(a1)) {
                            // ***** 水平方向 *****
                            if (a4 & 4) { }                                             // 左
                            else if (a4 & 8)  { a2 = a2 - imgvars[a1].can.width; }      // 右
                            else if (a4 & 1)  { a2 = a2 - imgvars[a1].can.width / 2; }  // 中央
                            else { }
                            // ***** 垂直方向 *****
                            if (a4 & 16) { }                                            // 上
                            else if (a4 & 32) { a3 = a3 - imgvars[a1].can.height; }     // 下
                            else if (a4 & 2)  { a3 = a3 - imgvars[a1].can.height / 2; } // 中央
                            else { }
                            // ***** 画像を描画(画像変数→ターゲット) *****
                            ctx.drawImage(imgvars[a1].can, a2, a3);
                        } else {
                            throw new Error("Image「" + a1 + "」がロードされてません。");
                        }
                    }
                    return true;
                }
                if (sym == "drawscaledimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10); // 先X
                    match(","); a3 = parseInt(expression(), 10); // 先Y
                    match(","); a4 = parseInt(expression(), 10); // 先W
                    match(","); a5 = parseInt(expression(), 10); // 先H
                    match(","); a6 = parseInt(expression(), 10); // 元X
                    match(","); a7 = parseInt(expression(), 10); // 元Y
                    match(","); a8 = parseInt(expression(), 10); // 元W
                    match(","); a9 = parseInt(expression(), 10); // 元H
                    match(")");
                    if (a1 == "screen") {
                        // ***** 画像を描画(表示画面→ターゲット) *****
                        ctx.drawImage(can1, a6, a7, a8, a9, a2, a3, a4, a5);
                    } else {
                        if (imgvars.hasOwnProperty(a1)) {
                            // ***** 画像を描画(画像変数→ターゲット) *****
                            ctx.drawImage(imgvars[a1].can, a6, a7, a8, a9, a2, a3, a4, a5);
                        } else {
                            throw new Error("Image「" + a1 + "」がロードされてません。");
                        }
                    }
                    return true;
                }
                break;

            case "e":
                if (sym == "end") {
                    end_flag = true;
                    return true;
                }
                break;

            case "f":
                if (sym == "farc") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    if (symbol[pc] == ")") {
                        a4 = a3;
                    } else {
                        match(","); a4 = parseFloat(expression()); // H
                    }
                    match(")");
                    a = a3 / 2;  // X方向の半径
                    b = a4 / 2;  // Y方向の半径
                    x0 = a1 + a; // 中心のX座標
                    y0 = a2 + b; // 中心のY座標
                    ctx.beginPath();
                    ctx.moveTo(a + x0, y0);
                    for (i = 1; i < 100; i++) {
                        ctx.lineTo(a * Math.cos(2 * Math.PI * i / 100) + x0, b * Math.sin(2 * Math.PI * i / 100) + y0);
                    }
                    ctx.closePath();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 で塗りつぶさない件の対策 *****
                    // ctx.rect(x0, y0, 1, 1);     // 真ん中に小さな四角を描くと、塗りつぶしエリアが反転するもよう
                    ctx.fill();
                    // 以下は不要になったもよう(Chrome v24)
                    // ctx.fillRect(x0, y0, 1, 1); // 反転して抜けた真ん中の小さな四角をさらに塗りつぶす
                    return true;
                }
                if (sym == "foval") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(","); a5 = parseFloat(expression()); // 開始角
                    match(","); a6 = parseFloat(expression()); // 描画角
                    match(")");
                    a = a3 / 2;  // X方向の半径
                    b = a4 / 2;  // Y方向の半径
                    x0 = a1 + a; // 中心のX座標
                    y0 = a2 + b; // 中心のY座標
                    rad1 = - a5 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
                    rad2 = - a6 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
                    if (rad2 < 0) { // パスを右巻きに統一する
                        rad1 = rad1 + rad2;
                        rad2 = -rad2;
                    }
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    for (i = 0; i <= 100; i++) {
                        ctx.lineTo(a * Math.cos(rad1 + rad2 * i / 100) + x0, b * Math.sin(rad1 + rad2 * i / 100) + y0);
                    }
                    ctx.closePath();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 で塗りつぶさない件の対策 *****
                    // ctx.rect(x0, y0, 1, 1);     // 真ん中に小さな四角を描くと、塗りつぶしエリアが反転するもよう
                    ctx.fill();
                    // 以下は不要になったもよう(Chrome v24)
                    // ctx.fillRect(x0, y0, 1, 1); // 反転して抜けた真ん中の小さな四角をさらに塗りつぶす
                    return true;
                }
                if (sym == "frect") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(")");
                    ctx.fillRect(a1, a2, a3, a4);
                    return true;
                }
                if (sym == "fround") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(","); a5 = parseFloat(expression()); // RX
                    match(","); a6 = parseFloat(expression()); // RY
                    match(")");
                    rx = a5;
                    ry = a6;
                    ctx.beginPath();
                    ctx.moveTo(a1 + rx , a2);
                    ctx.lineTo(a1 + a3 - rx, a2);
                    ctx.quadraticCurveTo(a1 + a3 , a2, a1 + a3, a2 + ry);
                    ctx.lineTo(a1 + a3 , a2 + a4 - ry);
                    ctx.quadraticCurveTo(a1 + a3 , a2 + a4, a1 + a3 - rx, a2 + a4);
                    ctx.lineTo(a1 + rx , a2 + a4);
                    ctx.quadraticCurveTo(a1, a2 + a4, a1, a2 + a4 -ry);
                    ctx.lineTo(a1 , a2 + ry);
                    ctx.quadraticCurveTo(a1, a2, a1 + rx, a2);
                    ctx.closePath();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 でカーブを描画しない件の対策 *****
                    // ctx.rotate(45 * Math.PI / 180);          // 回転させるとなぜか描画する
                    ctx.fill();
                    // 以下は不要になったもよう(Chrome v27)
                    // ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    // set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "func") {
                    pc = func[symbol[pc] + "\\end"];
                    return true;
                }
                if (sym == "funccall") {
                    match("("); 
                    // ***** 関数名を取得 *****
                    sym = symbol[pc++];

                    // ***** ポインタのとき *****
                    if (sym.charAt(0) == "*") {
                        // ***** 変数名取得 *****
                        pc--;
                        // var_name = getvarname();
                        var_name = getvarname(2); // ポインタ対応
                        // ***** 変数名を関数名とする *****
                        sym = var_name;
                    }

                    match("(");
                    // ***** 関数呼び出し情報の生成 *****
                    funccall_info = {};
                    // ***** 引数の取得 *****
                    func_params = [];
                    if (symbol[pc] == ")") {
                        pc++;
                    } else {
                        while (pc < symbol_len) {
                            func_params.push(expression());
                            if (symbol[pc] == ",") { 
                                pc++;
                                continue;
                            }
                            break;
                        }
                        match(")");
                    }
                    // ***** 戻り値を格納する変数名の取得 *****
                    if (symbol[pc] == ")") {
                        a1 = "";
                    } else {
                        match(",");
                        // a1 = getvarname();
                        a1 = getvarname(2); // ポインタ対応
                    }
                    match(")");
                    // ***** 関数の呼び出し *****
                    if (!func.hasOwnProperty(sym)) {
                        throw new Error("関数 '" + sym + "' の呼び出しに失敗しました(funccallはfuncで定義した関数のみ呼び出せます)。");
                    }
                    back_pc = pc;
                    pc = func[sym];

                    // ***** ローカル変数を生成 *****
                    vars.makeLocalScope();

                    // ***** 引数のセット *****
                    match("(");
                    if (symbol[pc] == ")") {
                        pc++;
                    } else {
                        i = 0;
                        while (pc < symbol_len) {
                            // var_name = getvarname(); // これはポインタ対応不可
                            var_name = getvarname(3); // 関数の引数用

                            // ***** 関数の引数のポインタ対応 *****
                            if (var_name.substring(0, 2) == "p\\") {
                                var_name = var_name.substring(2);
                                func_params[i] = String(func_params[i]);
                                // ***** 変数名のチェック *****
                                if (!(isAlpha(func_params[i].charAt(0)) || func_params[i].charAt(0) == "_")) {
                                    pc = back_pc;
                                    throw new Error("ポインタの指す先が不正です。");
                                }
                                func_params[i] = "a\\" + func_params[i];
                            }

                            if (i < func_params.length) {
                                // vars[var_name] = func_params[i];
                                vars.setVarValue(var_name, func_params[i]);
                                i++;
                            } else {
                                // vars[var_name] = 0;
                                vars.setVarValue(var_name, 0);
                            }
                            if (symbol[pc] == ",") {
                                pc++;
                                continue;
                            }
                            break;
                        }
                        match(")");
                    }
                    // ***** 関数の本体を実行 *****
                    match("{");
                    funccall_info.nestcall = false;
                    funccall_info.retvarname = a1;
                    funccall_info.func_back = back_pc;
                    funccall_info.func_start = pc;
                    funccall_info.func_end = func[sym + "\\end"];
                    funccall_stack.push(funccall_info);
                    return true;
                }
                break;

            case "g":
                if (sym == "gc") {
                    match("(");
                    match(")");
                    // ***** NOP *****
                    return true;
                }
                if (sym == "gosub") {
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        throw new Error("func内では gosub できません。");
                    }
                    // ***** ラベルへジャンプ *****
                    lbl_name = expression();
                    if (!label.hasOwnProperty(lbl_name)) {
                        throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                    }
                    gosub_back.push(pc);
                    pc = label[lbl_name];
                    return true;
                }
                if (sym == "goto") {
                    // ***** ラベルへジャンプ *****
                    lbl_name = expression();
                    if (!label.hasOwnProperty(lbl_name)) {
                        throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                    }
                    goto_pc = label[lbl_name];
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** 関数呼び出し情報をチェック *****
                        funccall_info = funccall_stack[funccall_stack.length - 1];
                        // ***** ジャンプ先がfunc内のときだけgotoが可能 *****
                        if ((goto_pc < funccall_info.func_start) || (goto_pc >= funccall_info.func_end)) {
                            throw new Error("funcの外へは goto できません。");
                        }
                    }
                    pc = goto_pc;
                    return true;
                }
                break;

            case "i":
                if (sym == "ifgoto\\") {    // 内部命令なので「\」を付けている
                    match("(");
                    pc--;
                    a1 = expression();
                    // match(")");
                    if (a1 != 0) {
                        // ***** ラベルへジャンプ *****
                        lbl_name = expression();
                        if (!label.hasOwnProperty(lbl_name)) {
                            throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                        }
                        goto_pc = label[lbl_name];
                        // ***** 関数内のとき *****
                        if (funccall_stack.length > 0) {
                            // ***** 関数呼び出し情報をチェック *****
                            funccall_info = funccall_stack[funccall_stack.length - 1];
                            // ***** ジャンプ先がfunc内のときだけgotoが可能 *****
                            if ((goto_pc < funccall_info.func_start) || (goto_pc >= funccall_info.func_end)) {
                                throw new Error("funcの外へは goto できません。");
                            }
                        }
                        pc = goto_pc;
                    } else {
                        pc++;
                    }
                    return true;
                }
                if (sym == "ifnotgoto\\") { // 内部命令なので「\」を付けている
                    match("(");
                    pc--;
                    a1 = expression();
                    // match(")");
                    if (a1 == 0) {
                        // ***** ラベルへジャンプ *****
                        lbl_name = expression();
                        if (!label.hasOwnProperty(lbl_name)) {
                            throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                        }
                        goto_pc = label[lbl_name];
                        // ***** 関数内のとき *****
                        if (funccall_stack.length > 0) {
                            // ***** 関数呼び出し情報をチェック *****
                            funccall_info = funccall_stack[funccall_stack.length - 1];
                            // ***** ジャンプ先がfunc内のときだけgotoが可能 *****
                            if ((goto_pc < funccall_info.func_start) || (goto_pc >= funccall_info.func_end)) {
                                throw new Error("funcの外へは goto できません。");
                            }
                        }
                        pc = goto_pc;
                    } else {
                        pc++;
                    }
                    return true;
                }
                break;

            case "l":
                if (sym == "label") {
                    pc++;
                    return true;
                }
                if (sym == "line") {
                    match("("); a1 = parseFloat(expression()); // X1
                    match(","); a2 = parseFloat(expression()); // Y1
                    match(","); a3 = parseFloat(expression()); // X2
                    match(","); a4 = parseFloat(expression()); // Y2
                    match(")");
                    ctx.beginPath();
                    ctx.moveTo(a1, a2);
                    ctx.lineTo(a3, a4);
                    ctx.stroke();
                    return true;
                }
                if (sym == "linewidth") {
                    match("(");
                    a1 = parseFloat(expression()); // W
                    match(")");
                    line_width = a1;
                    ctx.lineWidth = line_width;
                    return true;
                }
                if (sym == "loadimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = String(expression()); // 画像データ文字列
                    match(")");
                    // ***** FlashCanvas用 *****
                    if (!ctx.createImageData) { throw new Error("画像生成機能が利用できません。"); }
                    // ***** 画像データの取得 *****
                    g_data = a2.split(",");
                    i = 0;
                    col_num = parseInt(g_data[i++], 10);
                    col_data = [];
                    for (j = 0; j < col_num; j++) {
                        col_data[j] = {};
                        col_data[j].r = parseInt(g_data[i++], 10);
                        col_data[j].g = parseInt(g_data[i++], 10);
                        col_data[j].b = parseInt(g_data[i++], 10);
                    }
                    trans_col_no = parseInt(g_data[i++], 10);
                    img_w = parseInt(g_data[i++], 10);
                    img_h = parseInt(g_data[i++], 10);

                    // ***** エラーチェック *****
                    // if (img_w <= 0 || img_w > max_image_size || img_h <= 0 || img_h > max_image_size) {
                    if (!(img_w > 0 && img_w <= max_image_size && img_h > 0 && img_h <= max_image_size)) {
                        throw new Error("画像の縦横のサイズが不正です。1-" + max_image_size + "の間である必要があります。");
                    }

                    img_data = ctx.createImageData(img_w, img_h);
                    k = 0;
                    while (i < g_data.length) {
                        col_no = parseInt(g_data[i++], 10);
                        if (col_no == trans_col_no) {
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                        } else if (col_no >=0 && col_no < col_num) {
                            img_data.data[k++] = col_data[col_no].r;
                            img_data.data[k++] = col_data[col_no].g;
                            img_data.data[k++] = col_data[col_no].b;
                            img_data.data[k++] = 255;
                        } else {
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                            img_data.data[k++] = 0;
                        }
                    }
                    // ***** Canvasの生成 *****
                    imgvars[a1] = {};
                    // ***** uuCanvas用 *****
                    if (typeof (uu) != "undefined") {
                        imgvars[a1].can = uu.canvas.create();
                    } else {
                        imgvars[a1].can = document.createElement("canvas");
                    }
                    // ***** FlashCanvas Pro (将来用) で必要 *****
                    if (typeof (FlashCanvas) != "undefined") {
                        imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                        document.getElementById("body1").appendChild(imgvars[a1].can);
                        FlashCanvas.initElement(imgvars[a1].can);
                    }
                    imgvars[a1].can.width = img_w;
                    imgvars[a1].can.height = img_h;
                    imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
                    // ***** Canvasの各設定の初期化 *****
                    init_canvas_setting(imgvars[a1].ctx);
                    // ***** 画像を格納 *****
                    imgvars[a1].ctx.putImageData(img_data, 0, 0);
                    return true;
                }
                if (sym == "loadimgdata") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = String(expression()); // 画像データ文字列(data URI scheme)
                    match(")");
                    // ***** Canvasの生成 *****
                    imgvars[a1] = {};
                    // ***** uuCanvas用 *****
                    if (typeof (uu) != "undefined") {
                        imgvars[a1].can = uu.canvas.create();
                    } else {
                        imgvars[a1].can = document.createElement("canvas");
                    }
                    // ***** FlashCanvas Pro (将来用) で必要 *****
                    if (typeof (FlashCanvas) != "undefined") {
                        imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                        document.getElementById("body1").appendChild(imgvars[a1].can);
                        FlashCanvas.initElement(imgvars[a1].can);
                    }
                    imgvars[a1].can.width = 16;
                    imgvars[a1].can.height = 16;
                    imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
                    // ***** Canvasの各設定の初期化 *****
                    init_canvas_setting(imgvars[a1].ctx);
                    // ***** デバッグ用 *****
                    imgvars[a1].ctx.fillRect(0,0,16,16);
                    // ***** 完了フラグをリセット *****
                    imgvars[a1].loaded = false;
                    // ***** 画像データの取得 *****
                    // (非同期のため完了までに時間がかかるので注意)
                    img_obj = new Image();
                    img_obj.onload = function () {
                        // ***** Canvasのリサイズ *****
                        imgvars[a1].can.width = img_obj.width;
                        imgvars[a1].can.height = img_obj.height;
                        // ***** Canvasの各設定の初期化 *****
                        init_canvas_setting(imgvars[a1].ctx);
                        // ***** 画像を描画 *****
                        imgvars[a1].ctx.drawImage(img_obj, 0, 0);
                        // alert(img_obj.complete);
                        // ***** 完了フラグをセット *****
                        imgvars[a1].loaded = true;
                    };
                    img_obj.src = a2; // 常にonloadより後にsrcをセットすること
                    return true;
                }
                if (sym == "lock") {
                    match("(");
                    match(")");
                    // ***** NOP *****
                    return true;
                }
                break;

            case "m":
                if (sym == "makearray") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a3 = a2 - 1;
                        a2 = 0;
                        a4 = 0;
                    } else {
                        match(","); a3 = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
                            a4 = 0;
                        } else {
                            match(","); a4 = expression();
                        }
                    }
                    match(")");

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }

                    for (i = a2; i <= a3; i++) {
                        // vars[a1 + "[" + i + "]"] = a4;
                        vars.setVarValue(a1 + "[" + i + "]", a4);
                    }
                    return true;
                }
                if (sym == "makeimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10); // W
                    match(","); a3 = parseInt(expression(), 10); // H
                    match(")");

                    // ***** エラーチェック *****
                    // if (a2 <= 0 || a2 > max_image_size || a3 <= 0 || a3 > max_image_size) {
                    if (!(a2 > 0 && a2 <= max_image_size && a3 > 0 && a3 <= max_image_size)) {
                        throw new Error("画像の縦横のサイズが不正です。1-" + max_image_size + "の範囲で指定してください。");
                    }

                    // ***** Canvasの生成 *****
                    imgvars[a1] = {};
                    // ***** uuCanvas用 *****
                    if (typeof (uu) != "undefined") {
                        imgvars[a1].can = uu.canvas.create();
                    } else {
                        imgvars[a1].can = document.createElement("canvas");
                    }
                    // ***** FlashCanvas Pro (将来用) で必要 *****
                    if (typeof (FlashCanvas) != "undefined") {
                        imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                        document.getElementById("body1").appendChild(imgvars[a1].can);
                        FlashCanvas.initElement(imgvars[a1].can);
                    }
                    imgvars[a1].can.width = a2;
                    imgvars[a1].can.height = a3;
                    imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
                    // ***** Canvasの各設定の初期化 *****
                    init_canvas_setting(imgvars[a1].ctx);
                    return true;
                }
                if (sym == "msgdlg") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] != ")") {
                        match(","); a1 = String(expression());
                    }
                    match(")");
                    alert(a1);
                    keyclear();
                    mousebuttonclear();
                    dlg_flag = true;
                    return true;
                }
                break;

            case "o":
                if (sym == "onlocal") {
                    match("(");
                    match(")");
                    use_local_vars = true;
                    return true;
                }
                if (sym == "offlocal") {
                    match("(");
                    match(")");
                    use_local_vars = false;
                    return true;
                }
                if (sym == "origin") {
                    match("("); a1 = parseInt(expression(), 10); // X
                    match(","); a2 = parseInt(expression(), 10); // Y
                    match(")");
                    // ***** 座標系の原点座標設定 *****
                    ctx_originx = a1;
                    ctx_originy = a2;
                    ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "oval") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(","); a5 = parseFloat(expression()); // 開始角
                    match(","); a6 = parseFloat(expression()); // 描画角
                    match(")");
                    a = a3 / 2;  // X方向の半径
                    b = a4 / 2;  // Y方向の半径
                    x0 = a1 + a; // 中心のX座標
                    y0 = a2 + b; // 中心のY座標
                    rad1 = - a5 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
                    rad2 = - a6 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
                    ctx.beginPath();
                    ctx.moveTo(a * Math.cos(rad1) + x0, b * Math.sin(rad1) + y0);
                    for (i = 1; i <= 100; i++) {
                        ctx.lineTo(a * Math.cos(rad1 + rad2 * i / 100) + x0, b * Math.sin(rad1 + rad2 * i / 100) + y0);
                    }
                    ctx.stroke();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 で円が閉じない件の対策(中心を0.5ずらしたとき) *****
                    // ctx.fillRect(a * Math.cos(rad1) + x0, b * Math.sin(rad1) + y0, 0.5, 0.5);
                    return true;
                }
                break;

            case "p":
                if (sym == "point") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(")");
                    ctx.fillRect(a1, a2, 1, 1);
                    return true;
                }
                break;

            case "r":
                if (sym == "rect") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(")");
                    ctx.beginPath();
                    ctx.rect(a1, a2, a3, a4);
                    ctx.stroke();
                    return true;
                }
                if (sym == "return") {
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** 戻り値を取得 *****
                        if (symbol[pc] == ";") {
                            ret_num = 0;
                        } else {
                            ret_num = expression();
                        }
                        // ***** 関数呼び出し情報をチェック *****
                        funccall_info = funccall_stack[funccall_stack.length - 1];
                        // ***** ネストありのとき(通常の関数呼び出しのとき) *****
                        if (funccall_info.nestcall) {
                            // ***** 呼び出し元に復帰 *****
                            return_flag = true;
                            return true;
                        }
                        // ***** ネストなしのとき(funccall文で呼び出されたとき) *****

                        // ***** ローカル変数を解放 *****
                        vars.deleteLocalScope();

                        // ***** 戻り値を変数に格納 *****
                        // vars[funccall_info.retvarname] = ret_num;
                        vars.setVarValue(funccall_info.retvarname, ret_num);
                        // ***** 呼び出し元に復帰 *****
                        funccall_info = funccall_stack.pop();
                        pc = funccall_info.func_back;
                        return true;
                    }
                    // ***** gosubのとき *****
                    if (gosub_back.length > 0) {
                        // ***** 戻り先へ *****
                        pc = gosub_back.pop();
                        return true;
                    }
                    return_flag = true;
                    return true;
                }
                if (sym == "rotate") {
                    match("("); a1 = parseFloat(expression()); // 角度
                    if (symbol[pc] == ")") {
                        a2 = 0;
                        a3 = 0;
                    } else {
                        match(","); a2 = parseFloat(expression()); // 中心座標X
                        match(","); a3 = parseFloat(expression()); // 中心座標Y
                    }
                    match(")");
                    // ***** 座標系の角度設定 *****
                    ctx_rotate = a1 * Math.PI / 180;
                    ctx_rotateox = a2;
                    ctx_rotateoy = a3;
                    ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "round") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(","); a3 = parseFloat(expression()); // W
                    match(","); a4 = parseFloat(expression()); // H
                    match(","); a5 = parseFloat(expression()); // RX
                    match(","); a6 = parseFloat(expression()); // RY
                    match(")");
                    rx = a5;
                    ry = a6;
                    ctx.beginPath();
                    ctx.moveTo(a1 + rx , a2);
                    ctx.lineTo(a1 + a3 - rx, a2);
                    ctx.quadraticCurveTo(a1 + a3 , a2, a1 + a3, a2 + ry);
                    ctx.lineTo(a1 + a3 , a2 + a4 - ry);
                    ctx.quadraticCurveTo(a1 + a3 , a2 + a4, a1 + a3 - rx, a2 + a4);
                    ctx.lineTo(a1 + rx , a2 + a4);
                    ctx.quadraticCurveTo(a1, a2 + a4, a1, a2 + a4 -ry);
                    ctx.lineTo(a1 , a2 + ry);
                    ctx.quadraticCurveTo(a1, a2, a1 + rx, a2);
                    ctx.closePath();
                    // 以下は不要になったもよう(Chrome v27)
                    // // ***** Chrome v23 でカーブを描画しない件の対策 *****
                    // ctx.rotate(45 * Math.PI / 180);          // 回転させるとなぜか描画する
                    ctx.stroke();
                    // 以下は不要になったもよう(Chrome v27)
                    // ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    // set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                break;

            case "s":
                if (sym == "save") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] == ")") {
                        a2 = 0;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                    }
                    match(")");
                    save_data[a2] = a1;
                    return true;
                }
                if (sym == "scale") {
                    match("("); a1 = parseFloat(expression()); // X方向倍率
                    if (symbol[pc] == ")") {
                        a2 = a1;
                        a3 = 0;
                        a4 = 0;
                    } else {
                        match(","); a2 = parseFloat(expression()); // Y方向倍率
                        if (symbol[pc] == ")") {
                            a3 = 0;
                            a4 = 0;
                        } else {
                            match(","); a3 = parseFloat(expression()); // 中心座標X
                            match(","); a4 = parseFloat(expression()); // 中心座標Y
                        }
                    }
                    match(")");
                    // ***** エラーチェック *****
                    // if (a1 <= 0 || a1 > max_scale_size || a2 <= 0 || a2 > max_scale_size) {
                    if (!(a1 > 0 && a1 <= max_scale_size && a2 > 0 && a2 <= max_scale_size)) {
                        throw new Error("座標系の倍率の値が不正です。0より大きく" + max_scale_size + "以下の数値を指定してください。");
                    }
                    // ***** 座標系の倍率設定 *****
                    ctx_scalex = a1;
                    ctx_scaley = a2;
                    ctx_scaleox = a3;
                    ctx_scaleoy = a4;
                    ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "setfont") {
                    match("(");
                    a1 = String(expression()).toUpperCase();
                    match(")");
                    switch (a1) {
                        case "L": font_size = 30; break;
                        case "M": font_size = 24; break;
                        case "S": font_size = 16; break;
                        case "T": font_size = 12; break;
                        default: font_size = 24; break;
                    }
                    ctx.font = font_size + "px " + font_family;
                    return true;
                }
                if (sym == "setpixel") {
                    match("("); a1 = parseFloat(expression());   // X
                    match(","); a2 = parseFloat(expression());   // Y
                    match(","); a3 = parseInt(expression(), 10); // RGB
                    match(")");
                    col_r = (a3 & 0xff0000) >> 16; // R
                    col_g = (a3 & 0x00ff00) >> 8;  // G
                    col_b = (a3 & 0x0000ff);       // B
                    ctx.fillStyle = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
                    ctx.fillRect(a1, a2, 1, 1);
                    ctx.fillStyle = color_val;
                    return true;
                }
                if (sym == "setscsize") {
                    match("("); a1 = parseInt(expression(), 10); // W
                    match(","); a2 = parseInt(expression(), 10); // H
                    if (symbol[pc] == ")") {
                        a3 = a1;
                        a4 = a2;
                    } else {
                        match(","); a3 = parseInt(expression(), 10); // W2
                        match(","); a4 = parseInt(expression(), 10); // H2
                    }
                    match(")");
                    // ***** エラーチェック *****
                    // if (a1 <= 0 || a1 >= max_image_size || a2 <= 0 || a2 >= max_image_size ||
                    //     a3 <= 0 || a3 >= max_image_size || a4 <= 0 || a4 >= max_image_size) {
                    if (!(a1 > 0 && a1 <= max_image_size && a2 > 0 && a2 <= max_image_size &&
                          a3 > 0 && a3 <= max_image_size && a4 > 0 && a4 <= max_image_size)) {
                        throw new Error("縦横のサイズの値が不正です。1-" + max_image_size + "の範囲で指定してください。");
                    }
                    // ***** 画面サイズ設定 *****
                    can1.width = a1;
                    can1.height = a2;
                    can1.style.width = a3 + "px";
                    can1.style.height = a4 + "px";
                    // ***** Canvasの各設定のリセット *****
                    reset_canvas_setting(ctx1);
                    return true;
                }
                if (sym == "sleep") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    sleep_flag = true;
                    sleep_time = a1;
                    return true;
                }
                if (sym == "soft1") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    softkey[0] = a1;
                    disp_softkey();
                    return true;
                }
                if (sym == "soft2") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    softkey[1] = a1;
                    disp_softkey();
                    return true;
                }
                if (sym == "spmode") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    sp_compati_mode = a1;
                    if (sp_compati_mode == 1) {
                        font_size = 12;
                        ctx.font = font_size + "px " + font_family;
                        use_local_vars = false;
                    }
                    return true;
                }
                break;

            case "t":
                if (sym == "text") {
                    match("(");
                    // ***** uuCanvasでは文字列にしないとエラーになる *****
                    // a1 = expression();
                    a1 = String(expression());

                    // ***** Chrome v24 で全角スペースが半角のサイズで表示される件の対策 *****
                    a1 = a1.replace(/　/g, "  "); // 全角スペースを半角スペース2個に変換

                    // ***** uuCanvasで複数空白がうまく表示されない件の対策 *****
                    if (typeof (uu) != "undefined") {
                        a1 = a1.replace(/ /g, "\u00A0");
                    }

                    if (symbol[pc] == ")") {
                        a2 = a3 = a4 = 0;
                    } else {
                        match(","); a2 = parseInt(expression(), 10); // X
                        match(","); a3 = parseInt(expression(), 10); // Y
                        match(","); a4 = parseInt(expression(), 10); // アンカー
                    }
                    match(")");
                    // ***** 水平方向 *****
                    if (a4 & 4)       { ctx.textAlign = "left"; }    // 左
                    else if (a4 & 8)  { ctx.textAlign = "right"; }   // 右
                    else if (a4 & 1)  { ctx.textAlign = "center"; }  // 中央
                    else { ctx.textAlign = "left"; }
                    // ***** 垂直方向 *****
                    if (a4 & 16)      { ctx.textBaseline = "top"; }        // 上
                    else if (a4 & 32) { ctx.textBaseline = "bottom"; }     // 下
                    else if (a4 & 2)  { ctx.textBaseline = "middle"; }     // 中央
                    else if (a4 & 64) { ctx.textBaseline = "alphabetic"; } // ベースライン
                    else { ctx.textBaseline = "top"; }
                    // ***** 文字列表示 *****
                    ctx.fillText(a1, a2, a3);
                    return true;
                }
                if (sym == "trgt") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(")");
                    if (a1 == "off") {
                        can = can1;
                        ctx = ctx1;
                    } else if (imgvars.hasOwnProperty(a1)) {
                        can = imgvars[a1].can;
                        ctx = imgvars[a1].ctx;
                    } else {
                        throw new Error("Image「" + a1 + "」がロードされてません。");
                    }
                    // ***** Canvasの各設定のリセット *****
                    reset_canvas_setting(ctx);
                    return true;
                }
                break;

            case "u":
                if (sym == "unlock") {
                    match("(");
                    if (symbol[pc] == ")") {
                        a1 = 0;
                    } else {
                        a1 = parseInt(expression(), 10);
                    }
                    match(")");
                    // ***** NOP *****
                    return true;
                }
                break;

            case "}":
                // ***** 戻り値は0とする *****
                ret_num = 0;
                // ***** 関数内のとき *****
                if (funccall_stack.length > 0) {
                    // ***** 関数呼び出し情報をチェック *****
                    funccall_info = funccall_stack[funccall_stack.length - 1];
                    // ***** ネストありのとき(通常の関数呼び出しのとき) *****
                    if (funccall_info.nestcall) {
                        // ***** 呼び出し元に復帰 *****
                        return_flag = true;
                        return true;
                    }
                    // ***** ネストなしのとき(funccall文で呼び出されたとき) *****

                    // ***** ローカル変数を解放 *****
                    vars.deleteLocalScope();

                    // ***** 戻り値を変数に格納 *****
                    // vars[funccall_info.retvarname] = ret_num;
                    vars.setVarValue(funccall_info.retvarname, ret_num);
                    // ***** 呼び出し元に復帰 *****
                    funccall_info = funccall_stack.pop();
                    pc = funccall_info.func_back;
                    return true;
                }
                return_flag = true;
                return true;
                // break;

            case ";":
                return true;
                // break;

            case "@":
                match("(");
                // a1 = getvarname();
                a1 = getvarname(2); // ポインタ対応
                i = 0;
                while (pc < symbol_len) {
                    if (symbol[pc] == ")") { break; }
                    match(",");
                    a2 = expression();
                    // vars[a1 + "[" + i + "]"] = a2;
                    vars.setVarValue(a1 + "[" + i + "]", a2);
                    i++;
                }
                match(")");
                return true;
                // break;

        }

        // ***** 追加命令(戻り値のない関数)の処理 *****
        if (use_addfunc && typeof (statement_addfunc) == "function") {
            addfunc_ret = {};
            ret_addfunc = statement_addfunc(sym, addfunc_ret);
            if (addfunc_ret.ret_flag == true) { return ret_addfunc; }
        }

        // ***** 式の処理 *****
        pc--;
        expression();
        // ***** 戻り値を返す *****
        return true;
    }

    // ***** 式の処理 *****
    function expression() {
        var num;
        var sym;
        var i, j;

        // ***** 比較の処理 *****
        num = relop();
        // ***** 論理演算のループ処理 *****
        while (pc < symbol_len) {
            // ***** シンボル取り出し *****
            sym = symbol[pc];
            // ***** 「&」のとき *****
            if (sym == "&") {
                pc++;
                num = num & relop();
                continue;
            }
            // ***** 「&&」のとき *****
            if (sym == "&&") {
                pc++;
                i = 1;
                j = 1;
                if (num == 0) {
                    while (pc < symbol_len) {
                        if (i == 1) {
                            if (symbol[pc] == "," || symbol[pc] == ":") { break; }
                            if (symbol[pc] == "?") { j++; }
                            if (symbol[pc] == ";") { j--; }
                            if (j == 0) { break; }
                        }
                        if (symbol[pc] == "(" || symbol[pc] == "[") { i++; }
                        if (symbol[pc] == ")" || symbol[pc] == "]") { i--; }
                        if (i == 0) { break; }
                        pc++;
                    }
                    num = 0;
                } else if (relop() == 0) {
                    num = 0;
                } else {
                    num = 1;
                }
                continue;
            }
            // ***** 「|」のとき *****
            if (sym == "|") {
                pc++;
                num = num | relop();
                continue;
            }
            // ***** 「||」のとき *****
            if (sym == "||") {
                pc++;
                i = 1;
                j = 1;
                if (num != 0) {
                    while (pc < symbol_len) {
                        if (i == 1) {
                            if (symbol[pc] == "," || symbol[pc] == ":") { break; }
                            if (symbol[pc] == "?") { j++; }
                            if (symbol[pc] == ";") { j--; }
                            if (j == 0) { break; }
                        }
                        if (symbol[pc] == "(" || symbol[pc] == "[") { i++; }
                        if (symbol[pc] == ")" || symbol[pc] == "]") { i--; }
                        if (i == 0) { break; }
                        pc++;
                    }
                    num = 1;
                } else if (relop() != 0) {
                    num = 1;
                } else {
                    num = 0;
                }
                continue;
            }
            // ***** 「^」のとき *****
            if (sym == "^") {
                pc++;
                num = num ^ relop();
                continue;
            }
            // ***** 3項演算子「?:;」のとき *****
            if (sym == "?") {
                pc++;
                i = 1;
                if (num != 0) {
                    num = expression();
                    match(":");
                    while (pc < symbol_len) {
                        if (symbol[pc] == "?") { i++; }
                        if (symbol[pc] == ";") { i--; }
                        if (i == 0) { break; }
                        pc++;
                    }
                    match(";");
                } else {
                    while (pc < symbol_len) {
                        if (symbol[pc] == "?") { i += 2; }
                        if (symbol[pc] == ":" || symbol[pc] == ";") { i--; }
                        if (i == 0) { break; }
                        pc++;
                    }
                    match(":");
                    num = expression();
                    match(";");
                }
                continue;
            }
            // ***** 論理演算のループ処理終了 *****
            break;
        }
        // ***** 戻り値を返す *****
        return num;
    }

    // ***** 比較の処理 *****
    function relop() {
        var num;
        var sym;

        // ***** 加減算の処理 *****
        num = addsub();
        // ***** 比較のループ処理 *****
        while (pc < symbol_len) {
            // ***** シンボル取り出し *****
            sym = symbol[pc];
            // ***** 「<<」のとき *****
            if (sym == "<<") {
                pc++;
                num = num << addsub();
                continue;
            }
            // ***** 「<」のとき *****
            if (sym == "<") {
                pc++;
                num = (num < addsub()) ? 1 : 0;
                continue;
            }
            // ***** 「<=」のとき *****
            if (sym == "<=") {
                pc++;
                num = (num <= addsub()) ? 1 : 0;
                continue;
            }
            // ***** 「>>」のとき *****
            if (sym == ">>") {
                pc++;
                num = num >> addsub();
                continue;
            }
            // ***** 「>」のとき *****
            if (sym == ">") {
                pc++;
                num = (num > addsub()) ? 1 : 0;
                continue;
            }
            // ***** 「>=」のとき *****
            if (sym == ">=") {
                pc++;
                num = (num >= addsub()) ? 1 : 0;
                continue;
            }
            // ***** 「==」のとき *****
            if (sym == "==") {
                pc++;
                num = (num == addsub()) ? 1 : 0;
                continue;
            }
            // ***** 「!=」のとき *****
            if (sym == "!=") {
                pc++;
                num = (num != addsub()) ? 1 : 0;
                continue;
            }
            // ***** 比較のループ処理終了 *****
            break;
        }
        // ***** 戻り値を返す *****
        return num;
    }

    // ***** 加減算の処理 *****
    function addsub() {
        var num;
        var sym;

        // ***** 乗除算の処理 *****
        num = muldiv();
        // ***** 加減算のループ処理 *****
        while (pc < symbol_len) {
            // ***** シンボル取り出し *****
            sym = symbol[pc];
            // ***** 「+」のとき *****
            if (sym == "+") {
                pc++;
                // num = num + muldiv();
                num = (+num) + (+muldiv()); // 文字の連結にならないように数値にする
                continue;
            }
            // ***** 「.」のとき *****
            if (sym == ".") {
                pc++;
                num = String(num) + String(muldiv());
                continue;
            }
            // ***** 「-」のとき *****
            if (sym == "-") {
                pc++;
                num = num - muldiv();
                continue;
            }
            // ***** 加減算のループ処理終了 *****
            break;
        }
        // ***** 戻り値を返す *****
        return num;
    }

    // ***** 乗除算の処理 *****
    function muldiv() {
        var num;
        var sym;

        // ***** 因子の処理 *****
        num = factor();
        // ***** 乗除算のループ処理 *****
        while (pc < symbol_len) {
            // ***** シンボル取り出し *****
            sym = symbol[pc];
            // ***** 「*」のとき *****
            if (sym == "*") {
                pc++;
                num = num * factor();
                continue;
            }
            // ***** 「/」のとき *****
            if (sym == "/") {
                pc++;
                if (sp_compati_mode == 1) {
                    num = parseInt(num / factor(), 10);
                } else {
                    num = num / factor();
                }
                continue;
            }
            // ***** 「%」のとき *****
            if (sym == "%") {
                pc++;
                num = num % factor();
                continue;
            }
            // ***** 「\」のとき *****
            if (sym == "\\") {
                pc++;
                num = parseInt(num / factor(), 10);
                continue;
            }
            // ***** 乗除算のループ処理終了 *****
            break;
        }
        // ***** 戻り値を返す *****
        return num;
    }

    // ***** 因子の処理 *****
    function factor() {
        var num;
        var i, j, k;
        var ch;
        var sym;
        var pre_inc;
        var var_name;
        var a1, a2, a3, a4, a5;
        var x1, y1, x2, y2;
        var img_data = {};

        var func_params = [];
        var funccall_info = {};
        var back_pc;

        var sleep_time_start;
        var sleep_time_count;

        var addfunc_ret = {};
        var ret_addfunc;

        // ***** 戻り値の初期化 *****
        num = 0;
        // ***** シンボル取り出し *****
        sym = symbol[pc++];
        // ***** シンボルの場合分け *****
        switch (sym.charAt(0)) {
            case "a":
                if (sym == "abs") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.abs(a1);
                    return num;
                }
                if (sym == "acos") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.acos(a1) * 180 / Math.PI;
                    return num;
                }
                if (sym == "arraylen") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    if (symbol[pc] == ")") {
                        a2 = 0;
                        a3 = null;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
                            a3 = null;
                        } else {
                            match(","); a3 = parseInt(expression(), 10);
                        }
                    }
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;

                    // ***** エラーチェック *****
                    // if (a3 != null && (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size)) {
                    if (!(a3 == null || (a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size))) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }

                    // ***** カウント処理 *****
                    num = 0;
                    i = a2;
                    do {
                        // ***** 配列の存在チェック *****
                        if (vars.checkVar(a1 + "[" + i + "]")) {
                            num++;
                        } else if (a3 == null) {
                            break;
                        }
                        i++;
                    } while (a3 == null || i <= a3);
                    return num;
                }
                if (sym == "asin") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.asin(a1) * 180 / Math.PI;
                    return num;
                }
                if (sym == "atan") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.atan(a1) * 180 / Math.PI;
                    return num;
                }
                if (sym == "atan2") {
                    match("("); a1 = parseFloat(expression());
                    match(","); a2 = parseFloat(expression());
                    match(")");
                    // num = Math.atan2(a2, a1) * 180 / Math.PI;
                    num = Math.atan2(a1, a2) * 180 / Math.PI;
                    return num;
                }
                break;

            case "c":
                if (sym == "ceil") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.ceil(a1);
                    return num;
                }
                if (sym == "cos") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    if (sp_compati_mode == 1) {
                        num = parseInt(Math.cos(a1 * Math.PI / 180) * 100, 10);
                    } else {
                        num = Math.cos(a1 * Math.PI / 180);
                    }
                    return num;
                }
                break;

            case "d":
                if (sym == "day") {
                    num = new Date().getDate();
                    return num;
                }
                if (sym == "dayofweek") {
                    num = new Date().getDay(); // =0:日曜日,=1:月曜日 ... =6:土曜日
                    return num;
                }
                if (sym == "dcos") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.cos(a1 * Math.PI / 180);
                    return num;
                }
                if (sym == "dpow") {
                    match("("); a1 = parseFloat(expression());
                    match(","); a2 = parseFloat(expression());
                    match(")");
                    num = Math.pow(a1, a2);
                    return num;
                }
                if (sym == "dsin") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.sin(a1 * Math.PI / 180);
                    return num;
                }
                if (sym == "dtan") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.tan(a1 * Math.PI / 180);
                    return num;
                }
                break;

            case "e":
                if (sym == "exp") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.exp(a1);
                    return num;
                }
                break;

            case "f":
                if (sym == "floor") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.floor(a1);
                    return num;
                }
                break;

            case "g":
                if (sym == "getpixel") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    match(")");
                    // ***** 座標系の変換の分を補正 *****
                    x1 = a1;
                    y1 = a2;
                    x1 = x1 - ctx_scaleox;  // 拡大縮小の中心座標を移動
                    y1 = y1 - ctx_scaleoy;
                    x1 = x1 * ctx_scalex;   // 拡大縮小
                    y1 = y1 * ctx_scaley;
                    x1 = x1 + ctx_scaleox;  // 拡大縮小の中心座標を元に戻す
                    y1 = y1 + ctx_scaleoy;
                    x1 = x1 - ctx_rotateox; // 回転の中心座標を移動
                    y1 = y1 - ctx_rotateoy;
                    // ここでx2とy2を使わないと、計算結果がおかしくなるので注意
                    x2 = x1 * Math.cos(ctx_rotate) - y1 * Math.sin(ctx_rotate); // 回転
                    y2 = x1 * Math.sin(ctx_rotate) + y1 * Math.cos(ctx_rotate);
                    x1 = x2 + ctx_rotateox; // 回転の中心座標を元に戻す
                    y1 = y2 + ctx_rotateoy;
                    x1 = x1 + ctx_originx;  // 原点座標を移動
                    y1 = y1 + ctx_originy;
                    x1 = x1 | 0; // 整数化
                    y1 = y1 | 0; // 整数化
                    // ***** エラーチェック *****
                    // if (x1 < 0 || x1 >= can.width || y1 < 0 || y1 >= can.height) { return 0; }
                    if (!(x1 >= 0 && x1 < can.width && y1 >= 0 && y1 < can.height)) { return 0; }
                    // ***** 画像データを取得 *****
                    img_data = ctx.getImageData(x1, y1, 1, 1);
                    // ***** 色情報を取得 *****
                    num = (img_data.data[0] << 16) | (img_data.data[1] << 8) | img_data.data[2];
                    return num;
                }
                break;

            case "h":
                if (sym == "height") {
                    num = can1.height;
                    return num;
                }
                if (sym == "hour") {
                    num = new Date().getHours();
                    return num;
                }
                break;

            case "i":
                if (sym == "index") {
                    match("("); a1 = String(expression());
                    match(","); a2 = String(expression());
                    if (symbol[pc] == ")") {
                        a3 = 0;
                    } else {
                        match(","); a3 = parseInt(expression(), 10);
                    }
                    match(")");
                    num = a1.indexOf(a2, a3);
                    return num;
                }
                if (sym == "input") {
                    match("(");
                    if (symbol[pc] == ")") {
                        a1 = 0;
                    } else {
                        a1 = parseInt(expression(), 10);
                    }
                    match(")");
                    // ***** キー入力待ちはしない *****
                    if (input_buf.length > 0) {
                        num = input_buf.shift();
                    } else {
                        num = 0;
                    }
                    return num;
                }
                if (sym == "inputdlg") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] == ")") {
                        a2 = "";
                    } else {
                        match(","); a2 = String(expression());
                        if (symbol[pc] == ")") {
                            a3 = a4 = 0;
                        } else {
                            match(","); a3 = parseInt(expression(), 10); // 未使用
                            match(","); a4 = parseInt(expression(), 10); // 未使用
                        }
                    }
                    match(")");
                    num = prompt(a1, a2) || ""; // nullのときは空文字列にする
                    keyclear();
                    mousebuttonclear();
                    dlg_flag = true;
                    return num;
                }
                if (sym == "int") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    num = a1;
                    return num;
                }
                break;

            case "j":
                if (sym == "join") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = String(expression());
                    if (symbol[pc] == ")") {
                        a3 = 0;
                        a4 = null;
                    } else {
                        match(","); a3 = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
                            a4 = null;
                        } else {
                            match(","); a4 = parseInt(expression(), 10);
                        }
                    }
                    match(")");

                    // ***** NaN対策 *****
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a4 != null && (a4 - a3 + 1 < 1 || a4 - a3 + 1 > max_array_size)) {
                    if (!(a4 == null || (a4 - a3 + 1 >= 1 && a4 - a3 + 1 <= max_array_size))) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }

                    // ***** 連結処理 *****
                    num = "";
                    i = a3;
                    do {
                        // ***** 配列の存在チェック *****
                        if (a4 == null && !vars.checkVar(a1 + "[" + i + "]")) { break; }

                        if (num == "") {
                            // num = num + vars[a1 + "[" + i + "]"];
                            num = num + vars.getVarValue(a1 + "[" + i + "]");
                        } else {
                            // num = num + a2 + vars[a1 + "[" + i + "]"];
                            num = num + a2 + vars.getVarValue(a1 + "[" + i + "]");
                        }
                        i++;
                    } while (a4 == null || i <= a4);
                    return num;
                }
                break;

            case "k":
                // if (sym == "keydown") { // 名前がキー定数とかぶったため変更
                if (sym == "keydowncode") {
                    num = key_down_code;
                    return num;
                }
                if (sym == "keyinput") {
                    match("(");
                    if (symbol[pc] == ")") {
                        a1 = 0;
                    } else {
                        a1 = parseInt(expression(), 10);
                    }
                    match(")");
                    // ***** キー入力待ちはしない *****
                    if (keyinput_buf.length > 0) {
                        num = keyinput_buf.shift();
                    } else {
                        num = 0;
                    }
                    return num;
                }
                if (sym == "keyscan") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    if (key_down_stat[a1] == true) { num = 1; } else { num = 0; }
                    return num;
                }
                if (sym == "keypress") {
                    num = key_press_code;
                    return num;
                }
                break;

            case "l":
                if (sym == "load") {
                    match("(");
                    if (symbol[pc] == ")") {
                        a1 = 0;
                    } else {
                        a1 = parseInt(expression(), 10);
                    }
                    match(")");
                    if (!save_data.hasOwnProperty(a1)) {
                        num = "0";
                    } else {
                        num = save_data[a1];
                    }
                    // ***** 正負と小数も含めた数値チェック(-0.123等) *****
                    if (isFullDigit(num)) {
                        num = +num; // 数値にする
                    }
                    return num;
                }
                if (sym == "loadimgstat") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(")");
                    // ***** 完了フラグをチェックして返す *****
                    num = 0;
                    if (imgvars.hasOwnProperty(a1)) {
                        if (imgvars[a1].hasOwnProperty("loaded")) {
                            if (imgvars[a1].loaded == false) {
                                num = 1;
                            }
                        }
                    }
                    return num;
                }
                if (sym == "log") {
                    match("("); a1 = parseFloat(expression());
                    if (symbol[pc] == ")") {
                        a2 = 0;
                    } else {
                        match(","); a2 = parseFloat(expression());
                    }
                    match(")");
                    if (a2 == 0) {
                        num = Math.log(a1);
                    } else {
                        num = Math.log(a1) / Math.log(a2);
                    }
                    return num;
                }
                break;

            case "m":
                if (sym == "max") {
                    match("("); a1 = parseFloat(expression());
                    match(","); a2 = parseFloat(expression());
                    num = Math.max(a1, a2);
                    while (symbol[pc] == ",") {
                        pc++;
                        a3 = parseFloat(expression());
                        num = Math.max(num, a3);
                    }
                    match(")");
                    return num;
                }
                if (sym == "millisecond") {
                    num = new Date().getMilliseconds();
                    return num;
                }
                if (sym == "min") {
                    match("("); a1 = parseFloat(expression());
                    match(","); a2 = parseFloat(expression());
                    num = Math.min(a1, a2);
                    while (symbol[pc] == ",") {
                        pc++;
                        a3 = parseFloat(expression());
                        num = Math.min(num, a3);
                    }
                    match(")");
                    return num;
                }
                if (sym == "minute") {
                    num = new Date().getMinutes();
                    return num;
                }
                if (sym == "month") {
                    num = new Date().getMonth() + 1; // 1から12にするため1を加算
                    return num;
                }
                if (sym == "mousex") {
                    num = mousex;
                    return num;
                }
                if (sym == "mousey") {
                    num = mousey;
                    return num;
                }
                if (sym == "mousebtn") {
                    num = 0;
                    if (mouse_btn_stat[0] == true) { num = num | 1; }        // 左ボタン
                    if (mouse_btn_stat[1] == true) { num = num | (1 << 2); } // 中ボタン(シフト値1でないので注意)
                    if (mouse_btn_stat[2] == true) { num = num | (1 << 1); } // 右ボタン(シフト値2でないので注意)
                    return num;
                }
                break;

            case "p":
                if (sym == "pow") {
                    match("("); a1 = parseFloat(expression());
                    match(","); a2 = parseFloat(expression());
                    match(")");
                    num = Math.pow(a1, a2);
                    return num;
                }
                break;

            case "P":
                if (sym == "PI") {
                    num = Math.PI;
                    return num;
                }
                break;

            case "r":
                if (sym == "rand") {
                    // min から max までの整数の乱数を返す
                    // (Math.round() を用いると、非一様分布になるのでNG)
                    // num = Math.floor(Math.random() * (max - min + 1)) + min;
                    num = Math.floor(Math.random() * (2147483647 - (-2147483648) + 1)) + (-2147483648);
                    return num;
                }
                if (sym == "random") {
                    num = Math.random();
                    return num;
                }
                if (sym == "replace") {
                    match("("); a1 = String(expression());
                    match(","); a2 = String(expression());
                    match(","); a3 = String(expression());
                    if (symbol[pc] == ")") {
                        a4 = 0;
                        a5 = -1;
                    } else {
                        match(","); a4 = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
                            a5 = -1;
                        } else {
                            match(","); a5 = parseInt(expression(), 10);
                        }
                    }
                    match(")");
                    if (a1.length == 0 || a2.length == 0) {
                        num = a1;
                    } else {
                        i = 0;
                        j = a4;
                        k = 0;
                        num = a1.substring(0, j);
                        while (k >= 0) {
                            if (a5 >= 0 && i >= a5) { break; }
                            k = a1.indexOf(a2, j);
                            if (k >= 0) {
                                num = num + a1.substring(j, k) + a3;
                                i++;
                                j = k + a2.length;
                            }
                        }
                        num = num + a1.substring(j);
                    }
                    return num;
                }
                break;

            case "s":
                if (sym == "scan") {
                    num = 0;
                    // [0]-[9] (テンキーも含める)
                    if (key_down_stat[48] == true || key_down_stat[96]  == true) { num = num | 1; }
                    if (key_down_stat[49] == true || key_down_stat[97]  == true) { num = num | (1 << 1); }
                    if (key_down_stat[50] == true || key_down_stat[98]  == true) { num = num | (1 << 2); }
                    if (key_down_stat[51] == true || key_down_stat[99]  == true) { num = num | (1 << 3); }
                    if (key_down_stat[52] == true || key_down_stat[100] == true) { num = num | (1 << 4); }
                    if (key_down_stat[53] == true || key_down_stat[101] == true) { num = num | (1 << 5); }
                    if (key_down_stat[54] == true || key_down_stat[102] == true) { num = num | (1 << 6); }
                    if (key_down_stat[55] == true || key_down_stat[103] == true) { num = num | (1 << 7); }
                    if (key_down_stat[56] == true || key_down_stat[104] == true) { num = num | (1 << 8); }
                    if (key_down_stat[57] == true || key_down_stat[105] == true) { num = num | (1 << 9); }
                    // [*][#] は [z][x] にする
                    if (key_down_stat[90] == true)  { num = num | (1 << 10); }
                    if (key_down_stat[88] == true)  { num = num | (1 << 11); }
                    // [←][↑][→][↓]
                    if (key_down_stat[37] == true)  { num = num | (1 << 13); } // 12でないので注意
                    if (key_down_stat[38] == true)  { num = num | (1 << 12); } // 13でないので注意
                    if (key_down_stat[39] == true)  { num = num | (1 << 14); }
                    if (key_down_stat[40] == true)  { num = num | (1 << 15); }
                    // 決定ボタン は スペースキーとEnterキーにする
                    if (key_down_stat[32] == true || key_down_stat[13] == true)  { num = num | (1 << 16); }
                    // [Soft1][Soft2] は [c][v]にする
                    if (key_down_stat[67] == true) { num = num | (1 << 17); }
                    if (key_down_stat[86] == true) { num = num | (1 << 18); }
                    return num;
                }
                if (sym == "second") {
                    num = new Date().getSeconds();
                    return num;
                }
                if (sym == "setscl") {
                    match("("); a1 = parseFloat(expression());
                    if (symbol[pc] == ")") {
                        a2 = 0;
                    } else {
                        match(","); a2 = parseFloat(expression());
                    }
                    match(")");
                    a3 = Math.pow(10, a2);
                    num = Math.round(a1 * a3) / a3;
                    return num;
                }
                if (sym == "sin") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    if (sp_compati_mode == 1) {
                        num = parseInt(Math.sin(a1 * Math.PI / 180) * 100, 10);
                    } else {
                        num = Math.sin(a1 * Math.PI / 180);
                    }
                    return num;
                }
                if (sym == "split") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = String(expression());
                    match(","); a3 = String(expression());
                    if (symbol[pc] == ")") {
                        a4 = 0;
                    } else {
                        match(","); a4 = parseInt(expression(), 10);
                    }
                    match(")");
                    if (a2.length == 0 || a3.length == 0) {
                        num = 0;
                    } else {
                        i = 0;
                        j = 0;
                        k = 0;
                        while (k >= 0) {
                            if (a4 > 0 && i >= (a4 - 1)) { break; }
                            k = a2.indexOf(a3, j);
                            if (k >= 0) {
                                // vars[a1 + "[" + i + "]"] = a2.substring(j, k);
                                vars.setVarValue(a1 + "[" + i + "]", a2.substring(j, k));
                                i++;
                                j = k + 1;
                            }
                        }
                        // vars[a1 + "[" + i + "]"] = a2.substring(j);
                        vars.setVarValue(a1 + "[" + i + "]", a2.substring(j));
                        num = i + 1;
                    }
                    return num;
                }
                if (sym == "spweb") {
                    num = 1;
                    return num;
                }
                if (sym == "sqrt") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = Math.sqrt(a1);
                    return num;
                }
                if (sym == "sthigh") {
                    num = font_size;
                    return num;
                }
                if (sym == "strat") {
                    match("("); a1 = String(expression());
                    match(","); a2 = parseInt(expression(), 10);
                    match(")");
                    num = a1.charAt(a2);
                    return num;
                }
                if (sym == "strlen") {
                    match("("); 
                    a1 = String(expression());
                    match(")");
                    num = a1.length;
                    return num;
                }
                if (sym == "stwide") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = ctx.measureText(a1).width;
                    return num;
                }
                if (sym == "substr") {
                    match("("); a1 = String(expression());
                    match(","); a2 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a3 = a1.length - a2;
                    } else {
                        match(","); a3 = parseInt(expression(), 10);
                    }
                    match(")");
                    num = a1.substring(a2, a2 + a3);
                    return num;
                }
                break;

            case "t":
                if (sym == "tan") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    if (sp_compati_mode == 1) {
                        num = parseInt(Math.tan(a1 * Math.PI / 180) * 100, 10);
                    } else {
                        num = Math.tan(a1 * Math.PI / 180);
                    }
                    return num;
                }
                if (sym == "tick") {
                    num = new Date().getTime();
                    return num;
                }
                if (sym == "trim") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = a1.replace(/^\s+|\s+$/g,"");
                    return num;
                }
                break;

            case "w":
                if (sym == "width") {
                    num = can1.width;
                    return num;
                }
                break;

            case "y":
                if (sym == "year") {
                    num = new Date().getFullYear();
                    return num;
                }
                if (sym == "yndlg") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] != ")") {
                        match(","); a1 = String(expression());
                    }
                    match(")");
                    if (confirm(a1)) { num = "YES"; } else { num = "NO"; }
                    keyclear();
                    mousebuttonclear();
                    dlg_flag = true;
                    return num;
                }
                break;

            case "!":
                num = (factor() == 0) ? 1 : 0;
                return num;
                // break;

            case "~":
                num = ~factor();
                return num;
                // break;

            case '"':
                if (sym.length > 2) {
                    num = sym.substring(1, sym.length - 1);
                } else {
                    num = "";
                }
                return num;
                // break;

            case "(":
                num = expression();
                while (pc < symbol_len) {
                    if (symbol[pc] == ",") {
                        pc++;
                        num = expression();
                        continue;
                    }
                    break;
                }
                match(")");
                return num;
                // break;

            case "+":
                if (sym == "+") {
                    num = factor();
                    return num;
                }
                break;

            case "-":
                if (sym == "-") {
                    num = -factor();
                    return num;
                }
                break;

            case "&":
                // ***** アドレス的なもの *****
                // ***** (変数名を取得して返す) *****
                if (sym == "&") {
                    if (symbol[pc] == "(") {
                        match("(");
                        // var_name = getvarname();
                        var_name = getvarname(2); // ポインタ対応
                        match(")");
                    } else {
                        // var_name = getvarname();
                        var_name = getvarname(2); // ポインタ対応
                    }
                    // // ***** 変数がなければ作成 *****
                    // // if (typeof (vars[var_name]) == "undefined") { vars[var_name] = 0; }
                    // // if (!vars.hasOwnProperty(var_name)) { vars[var_name] = 0; }
                    // vars.getVarValue(var_name);
                    return var_name;
                }
                break;

        }

        // ***** 追加命令(戻り値のある関数)の処理 *****
        if (use_addfunc && typeof (factor_addfunc) == "function") {
            addfunc_ret = {};
            ret_addfunc = factor_addfunc(sym, addfunc_ret);
            if (addfunc_ret.ret_flag == true) { return ret_addfunc; }
        }

        // ***** 「++」「--」のとき *****
        pre_inc = 0;
        if (sym == "++") {
            pre_inc = 1;
            // ***** シンボル取り出し *****
            sym = symbol[pc++];
        }
        if (sym == "--") {
            pre_inc = -1;
            // ***** シンボル取り出し *****
            sym = symbol[pc++];
        }

        // ***** 1文字取り出す *****
        ch = sym.charAt(0);
        // ***** 数値のとき *****
        if (isDigit(ch)) {
            // ***** 数値を返す *****
            num = +sym; // 数値にする
            return num;
        }
        // ***** ポインタのとき *****
        if (ch == "*") {
            // ***** 変数名取得 *****
            pc--;
            // var_name = getvarname();
            var_name = getvarname(2); // ポインタ対応
        }
        // ***** アルファベットかアンダースコアかポインタのとき *****
        if (isAlpha(ch) || ch == "_" || ch == "*") {

            // ***** 関数のとき *****
            if (symbol[pc] == "(") {
                pc++;

                // ***** ポインタのとき *****
                if (ch == "*") {
                    // ***** 変数名を関数名とする *****
                    sym = var_name;
                }

                // ***** 関数呼び出し情報の生成 *****
                funccall_info = {};
                // ***** 引数の取得 *****
                func_params = [];
                if (symbol[pc] == ")") {
                    pc++;
                } else {
                    while (pc < symbol_len) {
                        func_params.push(expression());
                        if (symbol[pc] == ",") { 
                            pc++;
                            continue;
                        }
                        break;
                    }
                    match(")");
                }
                // ***** 関数の呼び出し *****
                if (!func.hasOwnProperty(sym)) {
                    // throw new Error("関数 '" + sym + "' は未定義です。");
                    throw new Error("関数 '" + sym + "' の呼び出しに失敗しました(関数が未定義、もしくは、戻り値のない関数を式の中で呼び出した等)。");
                }
                back_pc = pc;
                pc = func[sym];

                // ***** ローカル変数を生成 *****
                vars.makeLocalScope();

                // ***** 引数のセット *****
                match("(");
                if (symbol[pc] == ")") {
                    pc++;
                } else {
                    i = 0;
                    while (pc < symbol_len) {
                        // var_name = getvarname(); // これはポインタ対応不可
                        var_name = getvarname(3); // 関数の引数用
                        if (i < func_params.length) {

                            // ***** 関数の引数のポインタ対応 *****
                            if (var_name.substring(0, 2) == "p\\") {
                                var_name = var_name.substring(2);
                                func_params[i] = String(func_params[i]);
                                // ***** 変数名のチェック *****
                                if (!(isAlpha(func_params[i].charAt(0)) || func_params[i].charAt(0) == "_")) {
                                    pc = back_pc;
                                    throw new Error("ポインタの指す先が不正です。");
                                }
                                func_params[i] = "a\\" + func_params[i];
                            }

                            // vars[var_name] = func_params[i];
                            vars.setVarValue(var_name, func_params[i]);
                            i++;
                        } else {
                            // vars[var_name] = 0;
                            vars.setVarValue(var_name, 0);
                        }
                        if (symbol[pc] == ",") {
                            pc++;
                            continue;
                        }
                        break;
                    }
                    match(")");
                }
                // ***** 関数の本体を実行 *****
                // 文(ステートメント)の実行が再帰的になるので、
                // ブラウザに制御を返せないという制約がある
                match("{");
                funccall_info.nestcall = true;
                funccall_info.retvarname = "";
                funccall_info.func_back = back_pc;
                funccall_info.func_start = pc;
                funccall_info.func_end = func[sym + "\\end"];
                funccall_stack.push(funccall_info);
                // loop_time_start = new Date().getTime(); // ループ開始時間は呼び出し元でセットする
                nest++;
                while (pc < symbol_len) {
                    statement();
                    // DebugShow(pc + " ");
                    if (dlg_flag) {
                        dlg_flag = false;
                        // ***** ダイアログ表示中は処理時間に含めない *****
                        loop_time_start = new Date().getTime();
                    }
                    if (audmake_flag) {
                        audmake_flag = false;
                        // ***** 音楽生成中は処理時間に含めない *****
                        loop_time_start = new Date().getTime();
                    }
                    loop_time_count = new Date().getTime() - loop_time_start;
                    if (loop_time_count >= loop_time_max) {
                        throw new Error("処理時間オーバーです(" + loop_time_max + "msec以上ブラウザに制御が返らず)。func内でタイムアウトしました。");
                    }
                    if (stop_flag) { break; }
                    if (end_flag) { break; }
                    if (sleep_flag) {
                        sleep_flag = false;
                        // ***** ループでsleep処理 *****
                        if (sleep_time > loop_time_max) { sleep_time = loop_time_max; }
                        sleep_time_start = new Date().getTime();
                        while (true) {
                            sleep_time_count = new Date().getTime() - sleep_time_start;
                            if (sleep_time_count > sleep_time) { break; }
                        }
                        continue;
                    }
                    if (return_flag) { break; }
                }
                // DebugShow(pc + "\n");
                nest--;

                // ***** ローカル変数を解放 *****
                vars.deleteLocalScope();

                // ***** 呼び出し元に復帰 *****
                funccall_info = funccall_stack.pop();
                pc = funccall_info.func_back;
                // ***** 戻り値がないときは0をセット *****
                if (return_flag == false) { ret_num = 0; }
                // ***** フラグの復帰処理 *****
                dlg_flag = false;
                audmake_flag = false;
                sleep_flag = false;
                return_flag = false;
                // ***** 戻り値を返す *****
                return ret_num;
            }

            // ***** 変数の処理 *****

            // ***** ポインタ以外のとき *****
            if (ch != "*") {
                // ***** 変数名取得 *****
                pc--;
                // var_name = getvarname();
                var_name = getvarname(1); // ポインタ非対応
            }

            // // ***** 変数がなければ作成 *****
            // // if (!vars[var_name]) { vars[var_name] = 0; } // これは間違い
            // // if (typeof (vars[var_name]) == "undefined") { vars[var_name] = 0; }
            // // if (!vars.hasOwnProperty(var_name)) { vars[var_name] = 0; }
            // vars.getVarValue(var_name);
            // ***** プレ インクリメントのとき *****
            if (pre_inc != 0) {
                // vars[var_name] += pre_inc;
                // num = vars[var_name];
                num = vars.getVarValue(var_name);

                //num += pre_inc;
                num = (+num) + (+pre_inc); // 文字の連結にならないように数値にする

                vars.setVarValue(var_name, num);
                return num;
            }
            // ***** ポスト インクリメントのとき *****
            if (symbol[pc] == "++") {
                pc++;
                // num = vars[var_name];
                // vars[var_name] += 1;
                num = vars.getVarValue(var_name);

                // vars.setVarValue(var_name, num + 1);
                vars.setVarValue(var_name, (+num) + (+1)); // 文字の連結にならないように数値にする

                return num;
            }
            if (symbol[pc] == "--") {
                pc++;
                // num = vars[var_name];
                // vars[var_name] -= 1;
                num = vars.getVarValue(var_name);
                vars.setVarValue(var_name, num - 1);
                return num;
            }
            // ***** 代入のとき *****
            if (symbol[pc] == "=") {
                pc++;
                // vars[var_name] = expression();
                vars.setVarValue(var_name, expression());
            }
            if (symbol[pc] == "+=") {
                pc++;
                // vars[var_name] = vars[var_name] + expression();

                // num = vars.getVarValue(var_name) + expression();
                num = (+vars.getVarValue(var_name)) + (+expression()); // 文字の連結にならないように数値にする

                vars.setVarValue(var_name, num);
            }
            if (symbol[pc] == "-=") {
                pc++;
                // vars[var_name] = vars[var_name] - expression();
                num = vars.getVarValue(var_name) - expression();
                vars.setVarValue(var_name, num);
            }
            if (symbol[pc] == "*=") {
                pc++;
                // vars[var_name] = vars[var_name] * expression();
                num = vars.getVarValue(var_name) * expression();
                vars.setVarValue(var_name, num);
            }
            if (symbol[pc] == "/=") {
                pc++;
                if (sp_compati_mode == 1) {
                    // vars[var_name] = parseInt(vars[var_name] / expression(), 10);
                    num = parseInt(vars.getVarValue(var_name) / expression(), 10);
                    vars.setVarValue(var_name, num);
                } else {
                    // vars[var_name] = vars[var_name] / expression();
                    num = vars.getVarValue(var_name) / expression();
                    vars.setVarValue(var_name, num);
                }
            }
            if (symbol[pc] == "%=") {
                pc++;
                // vars[var_name] = vars[var_name] % expression();
                num = vars.getVarValue(var_name) % expression();
                vars.setVarValue(var_name, num);
            }
            if (symbol[pc] == "\\=") {
                pc++;
                // vars[var_name] = parseInt(vars[var_name] / expression(), 10);
                num = parseInt(vars.getVarValue(var_name) / expression(), 10);
                vars.setVarValue(var_name, num);
            }
            if (symbol[pc] == ".=") {
                pc++;
                // vars[var_name] = String(vars[var_name]) + String(expression());
                num = String(vars.getVarValue(var_name)) + String(expression());
                vars.setVarValue(var_name, num);
            }
            // ***** 変数の値を返す *****
            // num = vars[var_name];
            num = vars.getVarValue(var_name);
            return num;
        }
        // ***** 構文エラー *****
        if (sp_compati_mode != 1) {
            throw new Error("構文エラー 予期しない '" + symbol[pc - 1] + "' が見つかりました。");
        }
        // ***** 戻り値を返す *****
        num = 0;
        return num;
    }

    // ***** 変数名取得 *****
    // mode  モード(=1:ポインタ非対応, =2:ポインタ対応, =3:関数の引数用)
    // function getvarname() {
    function getvarname(mode) {
        var var_name;
        var var_name2;
        var array_index;
        var pointer_flag;

        // ***** 変数名取得 *****
        var_name = symbol[pc++];

        // ***** ポインタ対応のとき *****
        pointer_flag = false;
        if (mode == 2) {
            // ***** ポインタ的なもの(文頭の*の前にはセミコロンが必要) *****
            // ***** (変数の内容を変数名にする) *****
            if (var_name == "*") {
                if (symbol[pc] == "(") {
                    match("(");
                    var_name = getvarname(2); // ポインタ対応
                    // var_name = String(vars[var_name]);
                    var_name = String(vars.getVarValue(var_name));
                    match(")");
                    pointer_flag = true;
                } else {
                    var_name = getvarname(2); // ポインタ対応
                    // var_name = String(vars[var_name]);
                    var_name = String(vars.getVarValue(var_name));
                    pointer_flag = true;
                }
            }
            // (このまま下に降りて変数名の続き(配列の[]等)をサーチする)
        }

        // ***** 関数の引数用のとき *****
        if (mode == 3) {
            // ***** ポインタ的なもの(文頭の*の前にはセミコロンが必要) *****
            // ***** (実際は*を削っているだけ) *****
            if (var_name == "*") {
                if (symbol[pc] == "(") {
                    match("(");
                    var_name = getvarname(3); // 関数の引数用
                    match(")");
                    pointer_flag = true;
                } else {
                    var_name = getvarname(3); // 関数の引数用
                    pointer_flag = true;
                }
            }
            // (このまま下に降りて変数名の続き(配列の[]等)をサーチする)
        }

        // ***** 変数名のチェック *****
        if (!(isAlpha(var_name.charAt(0)) || var_name.charAt(0) == "_")) {
            if (mode == 2 && pointer_flag == true) {
                throw new Error("ポインタの指す先が不正です。");
            } else {
                throw new Error("変数名が不正です。");
            }
        }
        // ***** 接頭語のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            var_name2 = symbol[pc++];
            if (!(isAlpha(var_name2.charAt(0)) || var_name2.charAt(0) == "_")) {
                if (mode == 2 && pointer_flag == true) {
                    throw new Error("ポインタの指す先が不正です。");
                } else {
                    throw new Error("変数名が不正です。");
                }
            }
            var_name = var_name + " " + var_name2;
        }
        // ***** 配列変数のとき *****
        while (symbol[pc] == "[") {
            pc++;
            // array_index = parseInt(expression(), 10);
            array_index = expression(); // 配列の添字に文字列もあり
            match("]");
            var_name = var_name + "[" + array_index + "]";
        }
        // ***** 関数の引数のポインタ対応 *****
        if (mode == 3 && pointer_flag == true) {
            var_name = "p\\" + var_name;
        }
        return var_name;
    }

    // ***** ラベル設定 *****
    function setlabel() {
        var i, j, k;
        var sym;
        var lbl_name;
        var func_name;

        // ***** シンボル解析のループ *****
        i = 0;
        label = {};
        func = {};
        while (i < symbol_len) {
            sym = symbol[i++];
            // ***** ラベルのとき *****
            if (sym == "label") {
                lbl_name = symbol[i];
                if (lbl_name.charAt(0) == '"' && lbl_name.length > 2) {
                    lbl_name = lbl_name.substring(1, lbl_name.length - 1);
                }
                if (label.hasOwnProperty(lbl_name)) {
                    debugpc = i - 1;
                    pc = i + 1;
                    throw new Error("ラベル '" + lbl_name + "' の定義が重複しています。"); 
                }
                label[lbl_name] = i + 1;
                continue;
            }
            // ***** 関数定義のとき *****
            if (sym == "func") {
                func_name = symbol[i];
                if (!(isAlpha(func_name.charAt(0)) || func_name.charAt(0) == "_")) {
                    debugpc = i - 1;
                    pc = i + 1;
                    throw new Error("関数名が不正です。");
                }
                if (func.hasOwnProperty(func_name)) {
                    debugpc = i - 1;
                    pc = i + 1;
                    throw new Error("関数 '" + func_name + "' の定義が重複しています。"); 
                }
                func[func_name] = i + 1;
                j = i;
                k = 0;
                while (true) {
                    j++;
                    if (j >= symbol_len) {
                        debugpc = i - 1;
                        pc = j + 1;
                        throw new Error("funcの{}がありません。");
                    }
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") {
                        k--;
                        if (k == 0) {
                            func[func_name + "\\end"] = j + 1;
                            break;
                        }
                    }
                    if (symbol[j] == "func") {
                        debugpc = i - 1;
                        pc = j + 1;
                        throw new Error("funcの中にfuncを入れられません。");
                    }
                }
                continue;
            }
        }
    }

    // ***** コンパイル *****
    // switch, if, for, while, do, break, continue を条件付きgotoに変換する
    // これによって、ループ中もブラウザに制御を返せるようになる
    function compile() {
        // ***** コンパイル *****
        symbol2 = [];
        symbol2_line = [];
        symbol2_len = 0;

        compile_stmnt(0, symbol_len, "", ""); // 再帰的になるので別関数にした

        // ***** 元のシンボルにコピー *****
        symbol = symbol2;
        symbol_line = symbol2_line;
        symbol_len = symbol2_len;
    }

    // ***** 文(ステートメント)のコンパイル *****
    function compile_stmnt(sym_start, sym_end, break_lbl, continue_lbl) {
        var i, j, k;
        var k2;
        var sym;
        var sym_line;

        var switch_exp, switch_stm, switch_default_stm, switch_end;
        var switch_case_no;
        var switch_case_exp = [];
        var switch_case_stm = [];
        var switch_case_stm_end;

        var if_exp, if_stm, if_stm_end, else_stm, if_end;
        var elsif_no;
        var elsif_exp = [];
        var elsif_stm = [];
        var elsif_stm_end = [];

        var for_exp1, for_exp2, for_exp3, for_stm, for_end;
        var while_exp, while_stm, while_end;
        var do_exp, do_stm, do_end;

        // ***** シンボル解析のループ *****
        i = sym_start;
        while (i < sym_end) {
            debugpc = i;
            pc = i + 1;
            sym = symbol[i];
            sym_line = symbol_line[i++];

            // ***** break文のとき *****
            if (sym == "break") {
                if (break_lbl == "") {
                    debugpc = i - 1;
                    pc = i;
                    throw new Error("予期しない break が見つかりました。");
                }
                symbol2_push("goto", sym_line);
                symbol2_push(break_lbl, sym_line);
                symbol2_push(";", sym_line); // コンパイルエラー対応2
                continue;
            }

            // ***** continue文のとき *****
            if (sym == "continue") {
                if (continue_lbl == "") {
                    debugpc = i - 1;
                    pc = i;
                    throw new Error("予期しない continue が見つかりました。");
                }
                symbol2_push("goto", sym_line);
                symbol2_push(continue_lbl, sym_line);
                symbol2_push(";", sym_line); // コンパイルエラー対応2
                continue;
            }

            // ***** switch文のとき *****
            // switch (式) { case 式: 文 ... case 式: 文 default: 文 }
            if (sym == "switch") {
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                switch_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpc = i - 1;
                    pc = j + 1;
                    throw new Error("switch文の条件式がありません。");
                }
                while (j < sym_end) {
                    if (symbol[j] == "(") { k++; }
                    if (symbol[j] == ")") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(")", j++);
                match2("{", j++);
                // 文
                switch_stm = j;
                k = 1;
                switch_case_exp = [];
                switch_case_stm = [];
                switch_default_stm = -1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    if (k == 1) {
                        if (symbol[j] == "case") {
                            j++;
                            // 式
                            switch_case_exp.push(j);
                            if (symbol[j] == ":") {
                                debugpc = i - 1;
                                pc = j + 1;
                                throw new Error("case文の値がありません。");
                            }
                            k2 = 1;                  // caseに式を可能とする
                            while (j < sym_end) {
                                if (symbol[j] == "?") { k2++; }
                                if (symbol[j] == ":") { k2--; }
                                if (k2 == 0) { break; }
                                j++;
                            }
                            match2(":", j++);
                            // 文
                            switch_case_stm.push(j);
                            continue;
                        }
                        if (symbol[j] == "default") {
                            j++;
                            switch_case_exp.push(j); // プログラム簡単のためcaseの1個としても登録
                            match2(":", j++);
                            // 文
                            switch_default_stm = j;
                            switch_case_stm.push(j); // プログラム簡単のためcaseの1個としても登録
                            continue;
                        }
                    }
                    j++;
                }
                match2("}", j++);
                switch_end = j;
                // ***** 新しいシンボルの生成 *****
                // 式
                symbol2_push(";", sym_line); // コンパイルエラー対応1
                symbol2_push("switch_var\\" + i, sym_line);     // テンポラリ変数に条件式を代入
                symbol2_push("=", sym_line);
                symbol2_push("(", sym_line);
                for (j = switch_exp; j < switch_stm - 2; j++) {
                    symbol2_push(symbol[j], symbol_line[j]);
                    sym_line = symbol_line[j];
                }
                symbol2_push(")", sym_line);
                symbol2_push(";", sym_line);
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    if (switch_case_stm[switch_case_no] == switch_default_stm) { continue; }
                    symbol2_push("ifgoto\\", sym_line);
                    symbol2_push("(", sym_line);
                    symbol2_push("switch_var\\" + i, sym_line); // テンポラリ変数とcaseの値を比較
                    symbol2_push("==", sym_line);
                    symbol2_push("(", sym_line);
                    for (j = switch_case_exp[switch_case_no]; j < switch_case_stm[switch_case_no] - 1; j++) {
                        symbol2_push(symbol[j], symbol_line[j]);
                        sym_line = symbol_line[j];
                    }
                    symbol2_push(")", sym_line);
                    symbol2_push(")", sym_line);
                    symbol2_push('"switch_case_stm' + switch_case_no + '\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                }
                if (switch_default_stm >= 0) {
                    symbol2_push("goto", sym_line);
                    symbol2_push('"switch_default_stm\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                } else {
                    symbol2_push("goto", sym_line);
                    symbol2_push('"switch_end\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                }
                // 文
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    symbol2_push("label", sym_line);
                    if (switch_case_stm[switch_case_no] == switch_default_stm) {
                        symbol2_push('"switch_default_stm\\' + i + '"', sym_line);
                    } else {
                        symbol2_push('"switch_case_stm' + switch_case_no + '\\' + i + '"', sym_line);
                    }
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                    if (switch_case_no < switch_case_exp.length - 1) {
                        switch_case_stm_end = switch_case_exp[switch_case_no + 1];
                    } else {
                        switch_case_stm_end = switch_end;
                    }
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    compile_stmnt(switch_case_stm[switch_case_no], switch_case_stm_end - 1, '"switch_end\\' + i + '"', continue_lbl);
                }
                // 終了
                symbol2_push("label", sym_line);
                symbol2_push('"switch_end\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                i = switch_end;
                continue;
            }

            // ***** if文のとき *****
            // if (式) { 文 } elsif (式) { 文 } ... elsif (式) { 文 } else { 文 }
            if (sym == "if") {
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                if_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpc = i - 1;
                    pc = j + 1;
                    throw new Error("if文の条件式がありません。");
                }
                while (j < sym_end) {
                    if (symbol[j] == "(") { k++; }
                    if (symbol[j] == ")") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(")", j++);
                match2("{", j++);
                // 文
                if_stm = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2("}", j++);
                if_stm_end = j;
                // elsifまたはelse
                elsif_exp = [];
                elsif_stm = [];
                elsif_stm_end = [];
                else_stm = -1;
                while (j < sym_end) {
                    // elsif
                    if (symbol[j] == "elsif") {
                        j++;
                        match2("(", j++);
                        // 式
                        elsif_exp.push(j);
                        k = 1;
                        if (symbol[j] == ")") {
                            debugpc = j - 2;
                            pc = j + 1;
                            throw new Error("elsif文の条件式がありません。");
                        }
                        while (j < sym_end) {
                            if (symbol[j] == "(") { k++; }
                            if (symbol[j] == ")") { k--; }
                            if (k == 0) { break; }
                            j++;
                        }
                        match2(")", j++);
                        match2("{", j++);
                        // 文
                        elsif_stm.push(j);
                        k = 1;
                        while (j < sym_end) {
                            if (symbol[j] == "{") { k++; }
                            if (symbol[j] == "}") { k--; }
                            if (k == 0) { break; }
                            j++;
                        }
                        match2("}", j++);
                        elsif_stm_end.push(j);
                        continue;
                    }
                    // else
                    if (symbol[j] == "else") {
                        j++;
                        match2("{", j++);
                        // 文
                        else_stm = j;
                        k = 1;
                        while (j < sym_end) {
                            if (symbol[j] == "{") { k++; }
                            if (symbol[j] == "}") { k--; }
                            if (k == 0) { break; }
                            j++;
                        }
                        match2("}", j++);
                        break;
                    }
                    // その他
                    break;
                }
                // 終了
                if_end = j;
                // ***** 新しいシンボルの生成 *****
                // 式
                symbol2_push("ifnotgoto\\", sym_line);
                symbol2_push("(", sym_line);
                for (j = if_exp; j < if_stm - 2; j++) {
                    symbol2_push(symbol[j], symbol_line[j]);
                    sym_line = symbol_line[j];
                }
                symbol2_push(")", sym_line);
                if (elsif_exp.length > 0) {
                    symbol2_push('"elsif_exp0\\' + i + '"', sym_line);
                } else if (else_stm >= 0) {
                    symbol2_push('"else_stm\\' + i + '"', sym_line);
                } else {
                    symbol2_push('"if_end\\' + i + '"', sym_line);
                }
                symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                compile_stmnt(if_stm, if_stm_end - 1, break_lbl, continue_lbl);
                if (elsif_exp.length > 0 || else_stm >=0) {
                    symbol2_push("goto", sym_line);
                    symbol2_push('"if_end\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                }
                // elsif
                for (elsif_no = 0; elsif_no < elsif_exp.length; elsif_no++) {
                    // 式
                    symbol2_push("label", sym_line);
                    symbol2_push('"elsif_exp' + elsif_no + '\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                    symbol2_push("ifnotgoto\\", sym_line);
                    symbol2_push("(", sym_line);
                    for (j = elsif_exp[elsif_no]; j < elsif_stm[elsif_no] - 2; j++) {
                        symbol2_push(symbol[j], symbol_line[j]);
                        sym_line = symbol_line[j];
                    }
                    symbol2_push(")", sym_line);
                    if (elsif_exp.length > elsif_no + 1) {
                        symbol2_push('"elsif_exp' + (elsif_no + 1) + '\\' + i + '"', sym_line);
                    } else if (else_stm >= 0) {
                        symbol2_push('"else_stm\\' + i + '"', sym_line);
                    } else {
                        symbol2_push('"if_end\\' + i + '"', sym_line);
                    }
                    symbol2_push(";", sym_line); // コンパイルエラー対応2
                    // 文
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    compile_stmnt(elsif_stm[elsif_no], elsif_stm_end[elsif_no] - 1, break_lbl, continue_lbl);
                    if (elsif_exp.length > elsif_no + 1 || else_stm >=0) {
                        symbol2_push("goto", sym_line);
                        symbol2_push('"if_end\\' + i + '"', sym_line);
                        // symbol2_push(";", sym_line); // コンパイルエラー対応2
                    }
                }
                // else
                if (else_stm >= 0) {
                    // 文
                    symbol2_push("label", sym_line);
                    symbol2_push('"else_stm\\' + i + '"', sym_line);
                    // symbol2_push(";", sym_line); // コンパイルエラー対応2
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    compile_stmnt(else_stm, if_end - 1, break_lbl, continue_lbl);
                }
                // 終了
                symbol2_push("label", sym_line);
                symbol2_push('"if_end\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                i = if_end;
                continue;
            }

            // ***** for文のとき *****
            // for (式1; 式2; 式3) { 文 }
            if (sym == "for") {
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式1
                for_exp1 = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "?") { k++; }
                    if (symbol[j] == ";") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(";", j++);
                // 式2
                for_exp2 = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "?") { k++; }
                    if (symbol[j] == ";") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(";", j++);
                // 式3
                for_exp3 = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "(") { k++; }
                    if (symbol[j] == ")") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(")", j++);
                match2("{", j++);
                // 文
                for_stm = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2("}", j++);
                // 終了
                for_end = j;
                // ***** 新しいシンボルの生成 *****
                // 式1
                symbol2_push(";", sym_line); // コンパイルエラー対応1
                symbol2_push("(", sym_line);
                if (for_exp1 < for_exp2 - 1) {
                    for (j = for_exp1; j < for_exp2 - 1; j++) {
                        symbol2_push(symbol[j], symbol_line[j]);
                        sym_line = symbol_line[j];
                    }
                } else {
                    symbol2_push("1", sym_line); // 式1が空なら何もしない
                }
                symbol2_push(")", sym_line);
                symbol2_push(";", sym_line);
                symbol2_push("goto", sym_line);
                symbol2_push('"for_exp2\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 式3
                symbol2_push("label", sym_line);
                symbol2_push('"for_exp3\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                symbol2_push("(", sym_line);
                if (for_exp3 < for_stm - 2) {
                    for (j = for_exp3; j < for_stm - 2; j++) {
                        symbol2_push(symbol[j], symbol_line[j]);
                        sym_line = symbol_line[j];
                    }
                } else {
                    symbol2_push("1", sym_line); // 式3が空なら何もしない
                }
                symbol2_push(")", sym_line);
                symbol2_push(";", sym_line);
                // 式2
                symbol2_push("label", sym_line);
                symbol2_push('"for_exp2\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                symbol2_push("ifnotgoto\\", sym_line);
                symbol2_push("(", sym_line);
                if (for_exp2 < for_exp3 - 1) {
                    for (j = for_exp2; j < for_exp3 - 1; j++) {
                        symbol2_push(symbol[j], symbol_line[j]);
                        sym_line = symbol_line[j];
                    }
                } else {
                    symbol2_push("1", sym_line); // 式2が空なら無限ループ
                }
                symbol2_push(")", sym_line);
                symbol2_push('"for_end\\' + i + '"', sym_line);
                symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                compile_stmnt(for_stm, for_end - 1, '"for_end\\' + i + '"', '"for_exp3\\' + i + '"');
                // for (j = for_stm; j < for_end - 1; j++) {
                //     symbol2_push(symbol[j], symbol_line[j]);
                //     sym_line = symbol_line[j];
                // }
                symbol2_push("goto", sym_line);
                symbol2_push('"for_exp3\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 終了
                symbol2_push("label", sym_line);
                symbol2_push('"for_end\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                i = for_end;
                continue;
            }

            // ***** while文のとき *****
            // while (式) { 文 }
            if (sym == "while") {
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                while_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpc = i - 1;
                    pc = j + 1;
                    throw new Error("while文の条件式がありません。");
                }
                while (j < sym_end) {
                    if (symbol[j] == "(") { k++; }
                    if (symbol[j] == ")") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(")", j++);
                match2("{", j++);
                // 文
                while_stm = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2("}", j++);
                // 終了
                while_end = j;
                // ***** 新しいシンボルの生成 *****
                // 式
                symbol2_push("label", sym_line);
                symbol2_push('"while_exp\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                symbol2_push("ifnotgoto\\", sym_line);
                symbol2_push("(", sym_line);
                for (j = while_exp; j < while_stm - 2; j++) {
                    symbol2_push(symbol[j], symbol_line[j]);
                    sym_line = symbol_line[j];
                }
                symbol2_push(")", sym_line);
                symbol2_push('"while_end\\' + i + '"', sym_line);
                symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                compile_stmnt(while_stm, while_end - 1, '"while_end\\' + i + '"', '"while_exp\\' + i + '"');
                symbol2_push("goto", sym_line);
                symbol2_push('"while_exp\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 終了
                symbol2_push("label", sym_line);
                symbol2_push('"while_end\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                i = while_end;
                continue;
            }

            // ***** do文のとき *****
            // do { 文 } while (式)
            if (sym == "do") {
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("{", j++);
                // 文
                do_stm = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2("}", j++);
                if (symbol[j] != "while") {
                    debugpc = i - 1;
                    pc = j + 1;
                    throw new Error("do文のwhileがありません。");
                }
                j++;
                match2("(", j++);
                // 式
                do_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpc = i - 1;
                    pc = j + 1;
                    throw new Error("do文の条件式がありません。");
                }
                while (j < sym_end) {
                    if (symbol[j] == "(") { k++; }
                    if (symbol[j] == ")") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2(")", j++);
                // 終了
                do_end = j;
                // ***** 新しいシンボルの生成 *****
                // 文
                symbol2_push("label", sym_line);
                symbol2_push('"do_stm\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                compile_stmnt(do_stm, do_exp - 3, '"do_end\\' + i + '"', '"do_stm\\' + i + '"');
                // 式
                symbol2_push("ifgoto\\", sym_line);
                symbol2_push("(", sym_line);
                for (j = do_exp; j < do_end - 1; j++) {
                    symbol2_push(symbol[j], symbol_line[j]);
                    sym_line = symbol_line[j];
                }
                symbol2_push(")", sym_line);
                symbol2_push('"do_stm\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                // 終了
                symbol2_push("label", sym_line);
                symbol2_push('"do_end\\' + i + '"', sym_line);
                // symbol2_push(";", sym_line); // コンパイルエラー対応2
                i = do_end;
                continue;
            }

            // ***** その他のとき *****
            symbol2_push(sym, sym_line);
        }
    }

    // ***** シンボル追加 *****
    function symbol_push(sym, line_no) {
        // symbol.push(sym);
        // symbol_line.push(line_no);
        symbol[symbol_len] = sym;
        symbol_line[symbol_len++] = line_no;
    }
    function symbol2_push(sym, line_no) {
        // symbol2.push(sym);
        // symbol2_line.push(line_no);
        symbol2[symbol2_len] = sym;
        symbol2_line[symbol2_len++] = line_no;
    }

    // ***** シンボル初期化 *****
    function initsymbol() {
        var i;
        var src_len;
        var ch, ch2;
        var sym_start;
        var dot_count;
        var zero_flag;
        var temp_st;
        var temp_no;
        var line_no;

        // ***** 終端追加 *****
        src = src + " end end end end";
        // ***** ソースの解析ループ *****
        i = 0;
        line_no = 1;
        symbol = [];
        symbol_line = [];
        symbol_len = 0;
        src_len = src.length;
        while (i < src_len) {
            // ***** 1文字取り出す *****
            ch = src.charAt(i++);
            ch2 = src.charAt(i);

            // ***** 空白かTABのとき *****
            if (ch == " " || ch == "\t") { continue; }
            // ***** 改行のとき *****
            if (ch == "\r" && ch2 == "\n") { i++; line_no++; continue; }
            if (ch == "\r" || ch == "\n") { line_no++; continue; }
            // ***** コメント「//」のとき *****
            if (ch == "/" && ch2 == "/") {
                while (i < src_len) {
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    if (ch == "\r" && ch2 == "\n") { i++; line_no++; break; }
                    if (ch == "\r" || ch == "\n") { line_no++; break; }
                }
                continue;
            }
            // ***** コメント「'」のとき *****
            if (ch == "'") {
                while (i < src_len) {
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    if (ch == "'") { break; }
                    if (ch == "\r" && ch2 == "\n") { i++; line_no++; continue; }
                    if (ch == "\r" || ch == "\n") { line_no++; continue; }
                }
                continue;
            }

            // ***** 有効文字のとき *****
            sym_start = i - 1;
            // ***** 16進数のとき *****
            if (ch == "0" && ch2 == "x") {
                i++;
                while (i < src_len) {
                    ch = src.charAt(i);
                    if (isHex(ch)) { i++; } else { break; }
                }
                temp_st = src.substring(sym_start, i);
                temp_no = parseInt(temp_st, 16); // 16進数変換

                // ***** NaN対策 *****
                temp_no = temp_no | 0;

                symbol_push(String(temp_no), line_no); // 文字列にする
                continue;
            }
            // ***** 10進数のとき *****
            if (isDigit(ch)) {
                dot_count = 0;
                zero_flag = 0;
                if (ch == "0" && isDigit(ch2)) { sym_start = i; } else { zero_flag = 1; } // 先頭の0をカット
                while (i < src_len) {
                    ch = src.charAt(i);
                    ch2 = src.charAt(i + 1);
                    if (ch == "." && isDigit(ch2)) { dot_count++; } // 小数点チェック
                    if (isDigit(ch) || (ch == "." && isDigit(ch2))) { i++; } else { break; } // 小数点対応
                    if (zero_flag == 0 && ch == "0" && isDigit(ch2)) { sym_start = i; } else { zero_flag = 1; } // 先頭の0をカット
                }
                if (dot_count >= 2) { throw new Error("数値の小数点重複エラー"); }
                symbol_push(src.substring(sym_start, i), line_no);
                continue;
            }
            // ***** アルファベットかアンダースコアのとき *****
            if (isAlpha(ch) || ch == "_") {
                while (i < src_len) {
                    ch = src.charAt(i);
                    if (isAlpha(ch) || ch == "_" || isDigit(ch)) { i++; } else { break; }
                }
                temp_st = src.substring(sym_start, i);

                // ***** 定数のとき *****
                if (constants.hasOwnProperty(temp_st)) {
                    // ***** 値に展開する *****
                    temp_st = String(constants[temp_st]);
                }

                symbol_push(temp_st, line_no);
                continue;
            }
            // ***** 文字列のとき *****
            if (ch == '"') {
                while (i < src_len) {
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    if (ch == "\\") {
                        if (ch2 == "\\" || ch2 == '"') {
                            i++;
                            continue;
                        } else {
                            throw new Error("文字列のエスケープエラー");
                        }
                    }
                    if (ch == '"') { break; }
                    if (ch == "\r" && ch2 == "\n") { i++; line_no++; continue; }
                    if (ch == "\r" || ch == "\n") { line_no++; continue; }
                }
                temp_st = src.substring(sym_start, i);
                temp_st = temp_st.replace(/\\"/g, '"');   // 「"」のエスケープ
                temp_st = temp_st.replace(/\\\\/g, "\\"); // 「\」のエスケープ ← これは最後にしないといけない
                symbol_push(temp_st, line_no);
                continue;
            }
            // ***** 演算子その他のとき *****
            if (ch == "<") {
                if (ch2 == "=" || ch2 == "<") { i++; }
            }
            if (ch == ">") {
                if (ch2 == "=" || ch2 == ">") { i++; }
            }
            if (ch == "&") {
                if (ch2 == "&") { i++; }
            }
            if (ch == "|") {
                if (ch2 == "|") { i++; }
            }
            if (ch == "=") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "!") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "+") {
                if (ch2 == "+" || ch2 == "=") { i++; }
            }
            if (ch == "-") {
                if (ch2 == "-" || ch2 == "=") { i++; }
            }
            if (ch == "*") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "/") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "%") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "\\") {
                if (ch2 == "=") { i++; }
            }
            if (ch == ".") {
                if (ch2 == "=") { i++; }
            }
            symbol_push(src.substring(sym_start, i), line_no);
        }
    }


    // ***** 以下は追加命令の処理等 *****


    // ***** 追加命令(戻り値のない関数)の処理 *****
    function statement_addfunc(sym, addfunc_ret) {
        var i, j;
        var a1, a2, a3, a4, a5;
        var b1, b2, b3;
        var ch;
        var st1, st2;
        var x0, y0, x1, y1, x2, y2, x3, y3, x4, y4;
        var w1, h1, dx1, dy1, sx1, sy1, e1;
        var r1, a, b, x_old, y_old, drawflag;
        var img_data;
        var col_r, col_g, col_b, alpha;
        var i_start, i_end, i_plus;
        var paint_mode, ffill_obj;

        var mis, mis_no;
        var no, useflag, x100, y100, degree, speed100;
        var useflag_var_name, x100_var_name, y100_var_name;
        var degree_var_name, speed100_var_name, ch_var_name;
        var min_x, max_x, min_y, max_y, div_x, div_y;
        var range_use, min_no, max_no;

        // ***** 追加命令処理フラグON *****
        addfunc_ret.ret_flag = true;
        // ***** シンボルの場合分け *****
        switch (sym.charAt(0)) {

            case "a":
                if (sym == "audmode") {
                    match("("); 
                    a1 = parseInt(expression(), 10);
                    match(")");
                    aud_mode = a1;
                    return true;
                }
                if (sym == "audmake") {
                    match("("); a1 = parseInt(expression(), 10);
                    match(","); a2 = String(expression());
                    match(")");

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
                    audmake_flag = true;
                    return true;
                }
                if (sym == "audmakedata") {
                    match("("); a1 = parseInt(expression(), 10);
                    match(","); a2 = String(expression()); // 音楽データ(data URI scheme)
                    match(")");

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
                    audmake_flag = true;
                    return true;
                }
                if (sym == "audplay") {
                    match("("); a1 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a2 = 0;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                    }
                    match(")");

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
                }
                if (sym == "audspeedrate") {
                    match("("); a1 = parseInt(expression(), 10);
                    match(","); a2 = parseFloat(expression());
                    match(")");

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
                }
                if (sym == "audstop") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");

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
                }
                if (sym == "audvolume") {
                    match("("); a1 = parseInt(expression(), 10);
                    match(","); a2 = parseInt(expression(), 10);
                    match(")");

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
                }
                break;

            case "c":
                if (sym == "colalpha") {
                    match("("); a1 = parseInt(expression(), 10); // RGB
                    match(","); a2 = parseInt(expression(), 10); // alpha
                    match(")");
                    col_r = (a1 & 0xff0000) >> 16; // R
                    col_g = (a1 & 0x00ff00) >> 8;  // G
                    col_b = (a1 & 0x0000ff);       // B
                    alpha = a2 / 255;
                    color_val = "rgba(" + col_r + "," + col_g + "," + col_b + "," + alpha + ")";
                    ctx.strokeStyle = color_val;
                    ctx.fillStyle = color_val;
                    return true;
                }
                if (sym == "coloralpha") {
                    match("("); a1 = parseInt(expression(), 10); // R
                    match(","); a2 = parseInt(expression(), 10); // G
                    match(","); a3 = parseInt(expression(), 10); // B
                    match(","); a4 = parseInt(expression(), 10); // alpha
                    match(")");
                    col_r = a1;
                    col_g = a2;
                    col_b = a3;
                    alpha = a4 / 255;
                    color_val = "rgba(" + col_r + "," + col_g + "," + col_b + "," + alpha + ")";
                    ctx.strokeStyle = color_val;
                    ctx.fillStyle = color_val;
                    return true;
                }
                break;

            case "d":
                if (sym == "disaud") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    if (audplayer.hasOwnProperty(a1)) {
                        audplayer[a1].mmlplayer.stop();
                        delete audplayer[a1];
                    }
                    return true;
                }
                if (sym == "dismis") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    if (missile.hasOwnProperty(a1)) {
                        delete missile[a1];
                    }
                    // for (var prop_name in missile) { DebugShow(prop_name + " "); } DebugShow("\n");
                    return true;
                }
                if (sym == "disstrimg") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    ch = a1.charAt(0); // 1文字だけにする
                    if (ch.lenght == 0) { return true; }
                    if (stimg.hasOwnProperty(ch)) {
                        delete stimg[ch];
                    }
                    // for (var prop_name in stimg) { DebugShow(prop_name + " "); } DebugShow("\n");
                    return true;
                }
                break;

            case "f":
                if (sym == "fillarea") {
                    match("("); a1 = parseFloat(expression()); // X
                    match(","); a2 = parseFloat(expression()); // Y
                    if (symbol[pc] == ")") {
                        a3 = 0;
                        a4 = 0;
                        paint_mode = 0;
                    } else {
                        match(","); a3 = parseInt(expression(), 10); // しきい値
                        if (symbol[pc] == ")") {
                            a4 = 0;
                            paint_mode = 0;
                        } else {
                            match(","); a4 = parseInt(expression(), 10); // 境界色 RGB
                            paint_mode = 1;
                        }
                    }
                    match(")");
                    // ***** 座標系の変換の分を補正 *****
                    x1 = a1;
                    y1 = a2;
                    x1 = x1 - ctx_scaleox;  // 拡大縮小の中心座標を移動
                    y1 = y1 - ctx_scaleoy;
                    x1 = x1 * ctx_scalex;   // 拡大縮小
                    y1 = y1 * ctx_scaley;
                    x1 = x1 + ctx_scaleox;  // 拡大縮小の中心座標を元に戻す
                    y1 = y1 + ctx_scaleoy;
                    x1 = x1 - ctx_rotateox; // 回転の中心座標を移動
                    y1 = y1 - ctx_rotateoy;
                    // ここでx2とy2を使わないと、計算結果がおかしくなるので注意
                    x2 = x1 * Math.cos(ctx_rotate) - y1 * Math.sin(ctx_rotate); // 回転
                    y2 = x1 * Math.sin(ctx_rotate) + y1 * Math.cos(ctx_rotate);
                    x1 = x2 + ctx_rotateox; // 回転の中心座標を元に戻す
                    y1 = y2 + ctx_rotateoy;
                    x1 = x1 + ctx_originx;  // 原点座標を移動
                    y1 = y1 + ctx_originy;
                    x1 = x1 | 0; // 整数化
                    y1 = y1 | 0; // 整数化
                    // ***** 領域塗りつぶし *****
                    ffill_obj = new FloodFill(can, ctx, x1, y1, a3, paint_mode, a4, 255);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
                    ffill_obj.fill();  // 塗りつぶし処理
                    set_canvas_axis(ctx);                    // 座標系を再設定
                    return true;
                }
                if (sym == "fpoly") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(",");
                    // b1 = getvarname();
                    b1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(")");

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
                    // x0 = parseInt(vars[a1 + "[" + i + "]"], 10);
                    x0 = parseInt(vars.getVarValue(a1 + "[" + i + "]"), 10);
                    // y0 = parseInt(vars[b1 + "[" + i + "]"], 10);
                    y0 = parseInt(vars.getVarValue(b1 + "[" + i + "]"), 10);
                    ctx.moveTo(x0, y0);
                    for (i = a2 + 1; i <= a3; i++) {

                        // // ***** 配列の存在チェック *****
                        // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }
                        // if (!vars.checkVar(b1 + "[" + i + "]")) { break; }

                        // x1 = parseInt(vars[a1 + "[" + i + "]"], 10);
                        x1 = parseInt(vars.getVarValue(a1 + "[" + i + "]"), 10);
                        // y1 = parseInt(vars[b1 + "[" + i + "]"], 10);
                        y1 = parseInt(vars.getVarValue(b1 + "[" + i + "]"), 10);
                        ctx.lineTo(x1, y1);
                    }
                    ctx.closePath();
                    ctx.fill();
                    return true;
                }
                break;

            case "m":
                if (sym == "mismake") {
                    match("("); no = parseInt(expression(), 10);
                    match(","); useflag_var_name = getvarname(2); // ポインタ対応
                    match(","); x100_var_name = getvarname(2); // ポインタ対応
                    match(","); y100_var_name = getvarname(2); // ポインタ対応
                    match(","); degree_var_name = getvarname(2); // ポインタ対応
                    match(","); speed100_var_name = getvarname(2); // ポインタ対応
                    match(","); ch_var_name = getvarname(2); // ポインタ対応
                    match(","); min_x = parseInt(expression(), 10);
                    match(","); max_x = parseInt(expression(), 10);
                    match(","); min_y = parseInt(expression(), 10);
                    match(","); max_y = parseInt(expression(), 10);
                    match(","); div_x = parseFloat(expression());
                    match(","); div_y = parseFloat(expression());
                    match(")");
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
                }
                if (sym == "mismove") {
                    match("(");
                    if (symbol[pc] == ")") {
                        range_use = false;
                        min_no = 0;
                        max_no = 0;
                    } else {
                        range_use = true;
                        min_no = parseInt(expression(), 10);
                        match(","); max_no = parseInt(expression(), 10);
                    }
                    match(")");
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
                                    vars.setVarValue(mis.degree_var_name,   mis.degree);
                                    vars.setVarValue(mis.speed100_var_name, mis.speed100);
                                    vars.setVarValue(mis.ch_var_name,       mis.ch);
                                }
                            }
                        }
                    }
                    return true;
                }
                if (sym == "mistext") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        range_use = false;
                        min_no = 0;
                        max_no = 0;
                    } else {
                        range_use = true;
                        match(","); min_no = parseInt(expression(), 10);
                        match(","); max_no = parseInt(expression(), 10);
                    }
                    match(")");

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
                                if (mis.useflag != 0) {
                                    mis.x100 = parseInt(vars.getVarValue(mis.x100_var_name), 10);
                                    mis.y100 = parseInt(vars.getVarValue(mis.y100_var_name), 10);
                                    mis.ch =     String(vars.getVarValue(mis.ch_var_name));
                                    x1 = (mis.x100 / 100) | 0; // 整数化
                                    y1 = (mis.y100 / 100) | 0; // 整数化
                                    // txtpsetsub(a1, a2, a3, x1, y1, mis.ch);
                                    txtovrsub(a1, a2, a3, x1, y1, mis.ch);
                                }
                            }
                        }
                    }
                    return true;
                }
                break;

            case "p":
                if (sym == "poly") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(",");
                    // b1 = getvarname();
                    b1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a4 = 0;
                    } else {
                        match(","); a4 = parseInt(expression(), 10);
                    }
                    match(")");

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
                    // x0 = parseInt(vars[a1 + "[" + i + "]"], 10);
                    x0 = parseInt(vars.getVarValue(a1 + "[" + i + "]"), 10);
                    // y0 = parseInt(vars[b1 + "[" + i + "]"], 10);
                    y0 = parseInt(vars.getVarValue(b1 + "[" + i + "]"), 10);
                    ctx.moveTo(x0, y0);
                    for (i = a2 + 1; i <= a3; i++) {

                        // // ***** 配列の存在チェック *****
                        // if (!vars.checkVar(a1 + "[" + i + "]")) { break; }
                        // if (!vars.checkVar(b1 + "[" + i + "]")) { break; }

                        // x1 = parseInt(vars[a1 + "[" + i + "]"], 10);
                        x1 = parseInt(vars.getVarValue(a1 + "[" + i + "]"), 10);
                        // y1 = parseInt(vars[b1 + "[" + i + "]"], 10);
                        y1 = parseInt(vars.getVarValue(b1 + "[" + i + "]"), 10);
                        ctx.lineTo(x1, y1);
                    }
                    if (a4 == 0) { ctx.closePath(); }
                    ctx.stroke();
                    return true;
                }
                break;

            case "s":
                if (sym == "setstrimg") {
                    match("("); a1 = String(expression());
                    match(",");
                    // a2 = getvarname();
                    a2 = getvarname(2); // ポインタ対応
                    if (symbol[pc] == ")") {
                        a3 = 0;
                        a4 = 0;
                    } else {
                        match(","); a3 = parseInt(expression(), 10);
                        match(","); a4 = parseInt(expression(), 10);
                    }
                    match(")");
                    // ***** 画像文字割付を格納 *****
                    ch = a1.charAt(0); // 1文字だけにする
                    if (ch.lenght == 0) { return true; }
                    if (imgvars.hasOwnProperty(a2)) {
                        stimg[ch] = {};
                        stimg[ch].img = imgvars[a2];
                        stimg[ch].off_x = a3;
                        stimg[ch].off_y = a4;
                    } else {
                        throw new Error("Image「" + a1 + "」がロードされてません。");
                    }
                    return true;
                }
                break;

            case "t":
                if (sym == "transimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10); // RGB
                    match(")");
                    if (imgvars.hasOwnProperty(a1)) {
                        col_r = (a2 & 0xff0000) >> 16; // R
                        col_g = (a2 & 0x00ff00) >> 8;  // G
                        col_b = (a2 & 0x0000ff);       // B
                        // ***** 画像データを取得 *****
                        img_data = imgvars[a1].ctx.getImageData(0, 0, imgvars[a1].can.width, imgvars[a1].can.height);
                        // ***** 透明画像変換 *****
                        for (i = 0; i < img_data.data.length; i+=4) {
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
                        throw new Error("Image「" + a1 + "」がロードされてません。");
                    }
                    return true;
                }
                if (sym == "txtmake") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(","); a5 = parseInt(expression(), 10);
                    match(")");

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
                }
                if (sym == "txtdraw") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        x1 = 0;
                        y1 = 0;
                    } else {
                        match(","); x1 = parseInt(expression(), 10);
                        match(","); y1 = parseInt(expression(), 10);
                    }
                    match(")");

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

                        // ***** uuCanvasでは文字列にしないとエラーになる *****
                        st1 = String(st1);

                        // ***** Chrome v24 で全角スペースが半角のサイズで表示される件の対策 *****
                        st1 = st1.replace(/　/g, "  "); // 全角スペースを半角スペース2個に変換

                        // ***** uuCanvasで複数空白がうまく表示されない件の対策 *****
                        if (typeof (uu) != "undefined") {
                            st1 = st1.replace(/ /g, "\u00A0");
                        }

                        // ***** 文字列表示 *****
                        ctx.textAlign = "left";
                        ctx.textBaseline = "top";
                        ctx.fillText(st1, x1, y1);
                        y1 += font_size;
                    }
                    return true;
                }
                if (sym == "txtdrawimg") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); w1 = parseFloat(expression());
                    match(","); h1 = parseFloat(expression());
                    match(")");

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
                        for (j = 0; j < st1.length; j++) {
                            ch = st1.charAt(j);
                            if (stimg.hasOwnProperty(ch)) {
                                x2 = (x1 + (j * w1) + stimg[ch].off_x) | 0; // 整数化
                                y2 = (y1            + stimg[ch].off_y) | 0; // 整数化
                                ctx.drawImage(stimg[ch].img.can, x2, y2);
                            }
                        }
                        // for (ch in stimg) { // 速度ほとんど変わらず...
                        //     if (stimg.hasOwnProperty(ch)) {
                        //         j = 0;
                        //         while (j >= 0) {
                        //             j = st1.indexOf(ch, j);
                        //             if (j >= 0) {
                        //                 x2 = (x1 + (j * w1) + stimg[ch].off_x) | 0;
                        //                 y2 = (y1            + stimg[ch].off_y) | 0;
                        //                 ctx.drawImage(stimg[ch].img.can, x2, y2);
                        //                 j++;
                        //             }
                        //         }
                        //     }
                        // }
                        y1 += h1;
                    }
                    return true;
                }
                if (sym == "txtovr") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(",");
                    // b1 = getvarname();
                    b1 = getvarname(2); // ポインタ対応
                    match(","); b2 = parseInt(expression(), 10);
                    match(","); b3 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a4 = 0;
                    } else {
                        match(","); a4 = parseInt(expression(), 10);
                    }
                    match(")");

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
                    if (a1 == b1 && y1 < b2) { // 前から処理か後から処理か
                        i_start = b2;
                        i_end = b3;
                        i_plus = 1;
                    } else {
                        i_start = b3;
                        i_end = b2;
                        i_plus = -1;
                        y1 = y1 + (b3 - b2);
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
                }
                if (sym == "txtpset") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }

                    // ***** 描画処理 *****
                    // txtpsetsub(a1, a2, a3, x1, y1, a4);
                    txtovrsub(a1, a2, a3, x1, y1, a4);
                    return true;
                }
                if (sym == "txtline") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); x2 = parseInt(expression(), 10);
                    match(","); y2 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }
                    // if (Math.abs(x2 - x1) + 1 > max_str_size) {
                    if (!(Math.abs(x2 - x1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }
                    // if (Math.abs(y2 - y1) + 1 > max_str_size) {
                    if (!(Math.abs(y2 - y1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }

                    // ***** 描画処理 *****
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
                            ch = a4.substring(i % a4.length, (i % a4.length) + 1);
                            txtpsetsub(a1, a2, a3, x3, y3, ch);
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
                            ch = a4.substring(i % a4.length, (i % a4.length) + 1);
                            txtpsetsub(a1, a2, a3, x3, y3, ch);
                            y3 = y3 + sy1;
                            e1 = e1 + 2 * dx1;
                            if (e1 >= 0) {
                                x3 = x3 + sx1;
                                e1 = e1 - 2 * dy1;
                            }
                        }
                    }
                    return true;
                }
                if (sym == "txtbox") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); x2 = parseInt(expression(), 10);
                    match(","); y2 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }
                    // if (Math.abs(x2 - x1) + 1 > max_str_size) {
                    if (!(Math.abs(x2 - x1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }
                    // if (Math.abs(y2 - y1) + 1 > max_str_size) {
                    if (!(Math.abs(y2 - y1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }

                    // ***** 描画処理 *****
                    if (x1 > x2) { x3 = x2; x4 = x1; } else { x3 = x1; x4 = x2; }
                    if (y1 > y2) { y3 = y2; y4 = y1; } else { y3 = y1; y4 = y2; }
                    a5 = strrepeatsub(a4, x4 - x3 + 1);
                    txtovrsub(a1, a2, a3, x3, y3, a5);
                    txtovrsub(a1, a2, a3, x3, y4, a5);
                    for (i = y3; i <= y4; i++) {
                        txtpsetsub(a1, a2, a3, x3, i, a4);
                        txtpsetsub(a1, a2, a3, x4, i, a4);
                    }
                    return true;
                }
                if (sym == "txtfbox") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); x2 = parseInt(expression(), 10);
                    match(","); y2 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }
                    // if (Math.abs(x2 - x1) + 1 > max_str_size) {
                    if (!(Math.abs(x2 - x1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }
                    // if (Math.abs(y2 - y1) + 1 > max_str_size) {
                    if (!(Math.abs(y2 - y1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }

                    // ***** 描画処理 *****
                    if (x1 > x2) { x3 = x2; x4 = x1; } else { x3 = x1; x4 = x2; }
                    if (y1 > y2) { y3 = y2; y4 = y1; } else { y3 = y1; y4 = y2; }
                    a5 = strrepeatsub(a4, x4 - x3 + 1);
                    for (i = y3; i <= y4; i++) {
                        txtovrsub(a1, a2, a3, x3, i, a5);
                    }
                    return true;
                }
                if (sym == "txtcircle") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); r1 = parseInt(expression(), 10);
                    match(","); a = parseFloat(expression());
                    match(","); b = parseFloat(expression());
                    match(","); a4 = String(expression());
                    match(")");

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
                    x2 = r1;
                    drawflag = 0;
                    x_old = 0;
                    y_old = 0;
                    for (y2 = 0; y2 <= r1; y2++) {
                        // 円の内側になるまでループ
                        while (((a * a * x2 * x2) + (b * b * y2 * y2)) >= (r1 * r1)) {
                            x2--;
                            if (x2 < 0) { break; }
                        }
                        if (x2 < 0) {
                            if (drawflag == 1) {
                                // 上下の最後の部分を水平線で追加表示
                                txtovrsub(a1, a2, a3, x1 - x_old, y1 - y_old, strrepeatsub(a4, 2 * x_old + 1));
                                txtovrsub(a1, a2, a3, x1 - x_old, y1 + y_old, strrepeatsub(a4, 2 * x_old + 1));
                            }
                            break;
                        }
                        // 両端の点を表示
                        txtpsetsub(a1, a2, a3, x1 - x2, y1 - y2, a4);
                        txtpsetsub(a1, a2, a3, x1 + x2, y1 - y2, a4);
                        txtpsetsub(a1, a2, a3, x1 - x2, y1 + y2, a4);
                        txtpsetsub(a1, a2, a3, x1 + x2, y1 + y2, a4);
                        if (drawflag == 1) {
                            // 前回の足りない部分を水平線で追加表示
                            txtovrsub(a1, a2, a3, x1 - x_old , y1 - y_old, strrepeatsub(a4, x_old - x2));
                            txtovrsub(a1, a2, a3, x1 + x2 + 1, y1 - y_old, strrepeatsub(a4, x_old - x2));
                            txtovrsub(a1, a2, a3, x1 - x_old , y1 + y_old, strrepeatsub(a4, x_old - x2));
                            txtovrsub(a1, a2, a3, x1 + x2 + 1, y1 + y_old, strrepeatsub(a4, x_old - x2));
                        }
                        drawflag = 1;
                        x_old = x2;
                        y_old = y2;
                    }
                    return true;
                }
                if (sym == "txtfcircle") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); r1 = parseInt(expression(), 10);
                    match(","); a = parseFloat(expression());
                    match(","); b = parseFloat(expression());
                    match(","); a4 = String(expression());
                    match(")");

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
                    x2 = r1;
                    for (y2 = 0; y2 <= r1; y2++) {
                        // 円の内側になるまでループ
                        while (((a * a * x2 * x2) + (b * b * y2 * y2)) >= (r1 * r1)) {
                            x2--;
                            if (x2 < 0) { break; }
                        }
                        if (x2 < 0) { break; }
                        // 両端を結ぶ水平線を表示
                        txtovrsub(a1, a2, a3, x1 - x2, y1 - y2, strrepeatsub(a4, 2 * x2 + 1));
                        txtovrsub(a1, a2, a3, x1 - x2, y1 + y2, strrepeatsub(a4, 2 * x2 + 1));
                    }
                    return true;
                }
                break;

        }
        // ***** 追加命令処理フラグOFF *****
        addfunc_ret.ret_flag = false;
        // ***** 戻り値を返す *****
        return true;
    }


    // ***** 追加命令(戻り値のある関数)の処理 *****
    function factor_addfunc(sym, addfunc_ret) {
        var num;
        var i, j;
        var a1, a2, a3, a4;
        var ch;
        var st1;
        var x1, y1, x2, y2, x3, y3, x4, y4;
        var w1, h1, w2, h2;
        var dr, di, mr, mi, cr, ci, tr, ti, zr, zi, rep, norm2;
        var char_flag;

        var mis, mis_no;
        var min_no, max_no;

        // ***** 追加命令処理フラグON *****
        addfunc_ret.ret_flag = true;
        // ***** シンボルの場合分け *****
        switch (sym.charAt(0)) {

            case "a":
                if (sym == "audmakestat") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");

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
                }
                if (sym == "audstat") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");

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
                }
                break;

            case "c":
                if (sym == "calcfractal") {
                    match("("); x1 = parseFloat(expression());
                    match(","); y1 = parseFloat(expression());
                    match(","); dr = parseFloat(expression());
                    match(","); di = parseFloat(expression());
                    match(","); mr = parseFloat(expression());
                    match(","); mi = parseFloat(expression());
                    match(","); cr = parseFloat(expression());
                    match(","); ci = parseFloat(expression());
                    if (symbol[pc] == ")") {
                        rep = 50;
                        norm2 = 4;
                    } else {
                        match(","); rep = parseInt(expression(), 10);
                        if (symbol[pc] == ")") {
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
                }
                if (sym == "charcode") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] == ")") {
                        a2 = 0;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                    }
                    match(")");
                    num = a1.charCodeAt(a2);
                    return num;
                }
                if (sym == "charfrom") {
                    match("("); a1 = parseInt(expression(), 10);
                    if (symbol[pc] == ")") {
                        a2 = 0;
                        char_flag = false;
                    } else {
                        match(","); a2 = parseInt(expression(), 10);
                        char_flag = true;
                    }
                    match(")");
                    if (char_flag) {
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
                }
                break;

            case "f":
                if (sym == "fboxchk") {
                    match("("); x1 = parseFloat(expression());
                    match(","); y1 = parseFloat(expression());
                    match(","); w1 = parseFloat(expression());
                    match(","); h1 = parseFloat(expression());
                    match(","); x2 = parseFloat(expression());
                    match(","); y2 = parseFloat(expression());
                    match(","); w2 = parseFloat(expression());
                    match(","); h2 = parseFloat(expression());
                    match(")");
                    if (x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1) {
                        num = 1;
                    } else {
                        num = 0;
                    }
                    return num;
                }
                if (sym == "frombinstr") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = parseInt(a1, 2);
                    return num;
                }
                if (sym == "fromhexstr") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = parseInt(a1, 16);
                    return num;
                }
                break;

            case "m":
                if (sym == "misfreeno") {
                    match("("); min_no = parseInt(expression(), 10);
                    match(","); max_no = parseInt(expression(), 10);
                    match(")");
                    // ***** ミサイル空番号を検索 *****
                    num = -1;
                    for (mis_no in missile) {
                        if (missile.hasOwnProperty(mis_no)) {
                            mis = missile[mis_no];
                            if (mis.no >= min_no && mis.no <= max_no) {
                                mis.useflag = parseInt(vars.getVarValue(mis.useflag_var_name), 10);
                                if (mis.useflag == 0) {
                                    num = mis.no;
                                }
                            }
                        }
                    }
                    return num;
                }
                break;

            case "r":
                if (sym == "randint") {
                    match("("); a1 = parseInt(expression(), 10);
                    match(","); a2 = parseInt(expression(), 10);
                    match(")");
                    if (a1 > a2) { a3 = a2; a2 = a1; a1 = a3; }
                    // min から max までの整数の乱数を返す
                    // (Math.round() を用いると、非一様分布になるのでNG)
                    // num = Math.floor(Math.random() * (max - min + 1)) + min;
                    num = Math.floor(Math.random() * (a2 - a1 + 1)) + a1;
                    return num;
                }
                break;

            case "s":
                if (sym == "strmake") {
                    match("("); a1 = String(expression());
                    match(","); a2 = parseInt(expression(), 10);
                    match(")");

                    // ***** エラーチェック *****
                    // if (a2 > max_str_size) {
                    if (!(a2 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }

                    num = strrepeatsub(a1, a2);
                    return num;
                }
                if (sym == "strovr") {
                    match("("); a1 = String(expression());
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = String(expression());
                    if (symbol[pc] == ")") {
                        a4 = 0;
                    } else {
                        match(","); a4 = parseInt(expression(), 10);
                    }
                    match(")");
                    if (a4 == 1) {
                        num = strovrsub2(a1, a2, a3);
                    } else if (a4 == 2) {
                        num = strovrsub3(a1, a2, a3);
                    } else {
                        num = strovrsub(a1, a2, a3);
                    }
                    return num;
                }
                break;

            case "t":
                if (sym == "tobinstr") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    num = a1.toString(2);
                    return num;
                }
                if (sym == "tofloat") {
                    match("(");
                    a1 = parseFloat(expression());
                    match(")");
                    num = a1;
                    return num;
                }
                if (sym == "tohankaku") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] == ")") {
                        a2 = "";
                    } else {
                        match(","); a2 = String(expression());
                    }
                    match(")");
                    num = ConvZenHan.toHankaku(a1, a2);
                    return num;
                }
                if (sym == "tohexstr") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    num = a1.toString(16);
                    return num;
                }
                if (sym == "toint") {
                    match("(");
                    a1 = parseInt(expression(), 10);
                    match(")");
                    num = a1;
                    return num;
                }
                if (sym == "tolower") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = a1.toLowerCase();
                    return num;
                }
                if (sym == "tostr") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = a1;
                    return num;
                }
                if (sym == "toupper") {
                    match("(");
                    a1 = String(expression());
                    match(")");
                    num = a1.toUpperCase();
                    return num;
                }
                if (sym == "tozenkaku") {
                    match("("); a1 = String(expression());
                    if (symbol[pc] == ")") {
                        a2 = "";
                    } else {
                        match(","); a2 = String(expression());
                    }
                    match(")");
                    num = ConvZenHan.toZenkaku(a1, a2);
                    return num;
                }
                if (sym == "txtbchk") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(","); x2 = parseInt(expression(), 10);
                    match(","); y2 = parseInt(expression(), 10);
                    match(","); a4 = String(expression());
                    match(")");

                    // ***** NaN対策 *****
                    a2 = a2 | 0;
                    a3 = a3 | 0;

                    // ***** エラーチェック *****
                    // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
                    if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                        throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
                    }
                    // if (Math.abs(x2 - x1) + 1 > max_str_size) {
                    if (!(Math.abs(x2 - x1) + 1 <= max_str_size)) {
                        throw new Error("処理する文字数が不正です。" + max_str_size + "以下である必要があります。");
                    }
                    // if (Math.abs(y2 - y1) + 1 > max_str_size) {
                    if (!(Math.abs(y2 - y1) + 1 <= max_str_size)) {
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
                }
                if (sym == "txtpget") {
                    match("(");
                    // a1 = getvarname();
                    a1 = getvarname(2); // ポインタ対応
                    match(","); a2 = parseInt(expression(), 10);
                    match(","); a3 = parseInt(expression(), 10);
                    match(","); x1 = parseInt(expression(), 10);
                    match(","); y1 = parseInt(expression(), 10);
                    match(")");

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
                }
                break;

        }
        // ***** 追加命令処理フラグOFF *****
        addfunc_ret.ret_flag = false;
        // ***** 戻り値を返す *****
        num = 0;
        return num;
    }


    // ***** 文字列配列の点設定処理サブ *****
    function txtpsetsub(var_name, min_y, max_y, x, y, ch) {
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
    function txtovrsub(var_name, min_y, max_y, x, y, st2) {
        var st1;

        // ***** 上書き処理 *****
        if (y >= min_y && y <= max_y) {

            // // ***** 配列の存在チェック *****
            // if (!vars.checkVar(var_name + "[" + y + "]")) { return; }

            // st1 = vars[var_name + "[" + y + "]"];
            st1 = vars.getVarValue(var_name + "[" + y + "]");
            st1 = String(st1);
            st1 = strovrsub(st1, x, st2);
            // vars[var_name + "[" + y + "]"] = st1;
            vars.setVarValue(var_name + "[" + y + "]", st1);
        }
    }
    // ***** 文字列の繰り返し関数サブ *****
    function strrepeatsub(st1, count) {
        var ret_st;

        // ***** 戻り値の初期化 *****
        ret_st = "";
        // ***** エラーチェック *****
        if (st1.length == 0 || count <= 0) { return ret_st; }
        // ***** 作成処理 *****
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
    // ***** 文字列の上書き関数サブ *****
    // (文字列st1の位置xから文字列st2を上書きした文字列を返す。
    //  ただし返す文字列の長さはst1の長さとする(はみ出した部分はカット)。
    //  位置xは先頭文字を0とする)
    function strovrsub(st1, x, st2) {
        var ret_st;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** エラーチェック *****
        if (st1.length == 0 || st2.length == 0) { return ret_st; }
        // ***** 上書き処理 *****
        // (境界の条件によって場合分け)
        if (x + st2.length <= 0) {
            // ret_st = st1;
        } else if (x >= st1.length) {
            // ret_st = st1;
        } else if (x < 0  && (x + st2.length) <  st1.length) {
            ret_st = st2.substring(-x, st2.length) + st1.substring(x + st2.length, st1.length);
        } else if (x < 0  && (x + st2.length) >= st1.length) {
            ret_st = st2.substring(-x, -x + st1.length);
        } else if (x >= 0 && (x + st2.length) <  st1.length) {
            ret_st = st1.substring(0, x) + st2.substring(0, st2.length) + st1.substring(x + st2.length, st1.length);
        } else if (x >= 0 && (x + st2.length) >= st1.length) {
            ret_st = st1.substring(0, x) + st2.substring(0, st1.length - x);
        } else {
            // ret_st = st1; // ここには来ないはず
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }
    // ***** 文字列の上書き関数サブ2 *****
    // (半角/全角スペース以外を上書きする。他は「文字列の上書き関数サブ」と同じ)
    function strovrsub2(st1, x, st2) {
        var i;
        var ch;
        var ret_st;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** 上書き処理 *****
        // (半角/全角スペース以外を上書きする)
        for (i = 0; i < st2.length; i++) {
            ch = st2.charAt(i);
            if (ch != " " && ch != "　") {
                ret_st = strovrsub(ret_st, x + i, ch);
            }
        }
        // ***** 戻り値を返す *****
        return ret_st;
    }
    // ***** 文字列の上書き関数サブ3 *****
    // (半角/全角スペースのみ上書きする。他は「文字列の上書き関数サブ」と同じ)
    function strovrsub3(st1, x, st2) {
        var i;
        var ch;
        var ret_st;

        // ***** 戻り値の初期化 *****
        ret_st = st1;
        // ***** 上書き処理 *****
        // (半角/全角スペースのみ上書きする)
        for (i = 0; i < st2.length; i++) {
            ch = st2.charAt(i);
            if (ch == " " || ch == "　") {
                ret_st = strovrsub(ret_st, x + i, ch);
            }
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


})(Interpreter || (Interpreter = {}));


// ***** 以下は外部クラス *****


// ***** 文字列の全角半角変換用クラス(staticクラス) *****
var ConvZenHan = (function () {
    // ***** コンストラクタ *****
    // ***** (staticなクラスなので未使用) *****
    function ConvZenHan() { }
    // ***** 全角に変換する(staticメソッド) *****
    // ***** (staticなメソッドなのでprototype未使用) *****
    // ConvZenHan.prototype.toZenkaku = function (st1, mode1) {
    ConvZenHan.toZenkaku = function (st1, mode1) {
        var st2;
        var mode2;
        // ***** 引数をコピー *****
        st2 = st1;
        if (mode1 == "") { mode2 = "anpskd"; } else { mode2 = mode1; }
        // ***** アルファベットを全角に変換 *****
        if (mode2.indexOf("a") >= 0) {
            st2 = st2.replace(/[\u0041-\u005A]|[\u0061-\u007A]/g,
                function (c) {
                    if (!ConvZenHan.alphaToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.alphaToZenkaku[c];
                }
            );
        }
        // ***** 数字を全角に変換 *****
        if (mode2.indexOf("n") >= 0) {
            st2 = st2.replace(/[\u0030-\u0039]/g,
                function (c) {
                    if (!ConvZenHan.numberToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.numberToZenkaku[c];
                }
            );
        }
        // ***** 記号を全角に変換 *****
        if (mode2.indexOf("p") >= 0) {
            st2 = st2.replace(/[\u0021-\u007E]|[\uFF61-\uFF64]|[\u00A2-\u00A5]/g,
                function (c) {
                    if (!ConvZenHan.punctuationToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.punctuationToZenkaku[c];
                }
            );
        }
        // ***** スペースを全角に変換 *****
        if (mode2.indexOf("s") >= 0) {
            st2 = st2.replace(/ /g,
                function (c) {
                    if (!ConvZenHan.spaceToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.spaceToZenkaku[c];
                }
            );
        }

        // ***** カタカナを全角に変換 *****
        if (mode2.indexOf("k") >= 0 || mode2.indexOf("h") >= 0) {
            st2 = st2.replace(/[\uFF65-\uFF9D][ﾞﾟ]?/g,
                function (c) {
                    if (!ConvZenHan.katakanaToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.katakanaToZenkaku[c];
                }
            );
        }
        // ***** カタカナ(全角)をひらがなに変換 *****
        if (mode2.indexOf("h") >= 0) {
            st2 = st2.replace(/[\u30A1-\u30FC]/g,
                function (c) {
                    if (!ConvZenHan.KatakanaToHiragana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.KatakanaToHiragana[c];
                }
            );
        }
        // ***** ひらがなをカタカナ(全角)に変換 *****
        if (mode2.indexOf("t") >= 0) {
            st2 = st2.replace(/[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.HiraganaToKatakana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.HiraganaToKatakana[c];
                }
            );
        }

        // ***** 濁点を結合 *****
        if (mode2.indexOf("m") >= 0) {
            st2 = st2.replace(/[\u30A1-\u30FC][ﾞﾟ゛゜]?|[\u3041-\u3094][ﾞﾟ゛゜]?/g,
                function (c) {
                    if (!ConvZenHan.DakutenMarge.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenMarge[c];
                }
            );
        }
        // ***** 濁点を分離 *****
        if (mode2.indexOf("v") >= 0) {
            st2 = st2.replace(/[\u30A1-\u30FC]|[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.DakutenSplit.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenSplit[c];
                }
            );
        }
        // ***** 濁点を全角に変換 *****
        if (mode2.indexOf("d") >= 0) {
            st2 = st2.replace(/[ﾞﾟ]/g,
                function (c) {
                    if (!ConvZenHan.DakutenToZenkaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenToZenkaku[c];
                }
            );
        }
        // ***** 戻り値を返す *****
        return st2;
    };
    // ***** 半角に変換する(staticメソッド) *****
    ConvZenHan.toHankaku = function (st1, mode1) {
        var st2;
        var mode2;
        // ***** 引数をコピー *****
        st2 = st1;
        if (mode1 == "") { mode2 = "anpskd"; } else { mode2 = mode1; }
        // ***** アルファベットを半角に変換 *****
        if (mode2.indexOf("a") >= 0) {
            st2 = st2.replace(/[\uFF21-\uFF3A]|[\uFF41-\uFF5A]/g,
                function (c) {
                    if (!ConvZenHan.alphaToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.alphaToHankaku[c];
                }
            );
        }
        // ***** 数字を半角に変換 *****
        if (mode2.indexOf("n") >= 0) {
            st2 = st2.replace(/[\uFF10-\uFF19]/g,
                function (c) {
                    if (!ConvZenHan.numberToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.numberToHankaku[c];
                }
            );
        }
        // ***** 記号を半角に変換 *****
        if (mode2.indexOf("p") >= 0) {
            st2 = st2.replace(/[\uFF01-\uFF5E]|[\u3001-\u300D]|[\uFFE0-\uFFE5]/g,
                function (c) {
                    if (!ConvZenHan.punctuationToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.punctuationToHankaku[c];
                }
            );
        }
        // ***** スペースを半角に変換 *****
        if (mode2.indexOf("s") >= 0) {
            st2 = st2.replace(/[\u3000]/g,
                function (c) {
                    if (!ConvZenHan.spaceToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.spaceToHankaku[c];
                }
            );
        }

        // ***** ひらがなをカタカナ(全角)に変換 *****
        if (mode2.indexOf("t") >= 0) {
            st2 = st2.replace(/[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.HiraganaToKatakana.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.HiraganaToKatakana[c];
                }
            );
        }
        // ***** カタカナを半角に変換 *****
        if (mode2.indexOf("k") >= 0 || mode2.indexOf("t") >= 0) {
            st2 = st2.replace(/[\u30A1-\u30FC]/g,
                function (c) {
                    if (!ConvZenHan.katakanaToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.katakanaToHankaku[c];
                }
            );
        }

        // ***** 濁点を分離 *****
        if (mode2.indexOf("v") >= 0) {
            st2 = st2.replace(/[\u30A1-\u30FC]|[\u3041-\u3094]/g,
                function (c) {
                    if (!ConvZenHan.DakutenSplit.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenSplit[c];
                }
            );
        }
        // ***** 濁点を半角に変換 *****
        if (mode2.indexOf("d") >= 0) {
            st2 = st2.replace(/[゛゜]/g,
                function (c) {
                    if (!ConvZenHan.DakutenToHankaku.hasOwnProperty(c)) { return c; }
                    return ConvZenHan.DakutenToHankaku[c];
                }
            );
        }
        // ***** 戻り値を返す *****
        return st2;
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
        // ***** 0除算エラー対策 *****
        if (this.div_x == 0) { this.div_x = 1; }
        if (this.div_y == 0) { this.div_y = 1; }
    }
    // ***** 移動 *****
    Missile.prototype.move = function () {
        var x1, y1;

        // ***** 有効チェック *****
        if (this.useflag != 0) {
            // ***** 次の座標を計算 *****
            this.x100 = this.x100 + this.speed100 * Math.cos(this.degree * Math.PI / 180) / this.div_x;
            this.y100 = this.y100 + this.speed100 * Math.sin(this.degree * Math.PI / 180) / this.div_y;
            this.x100 = this.x100 | 0; // 整数化
            this.y100 = this.y100 | 0; // 整数化
            x1 = this.x100 / 100;
            y1 = this.y100 / 100;
            // ***** 座標の範囲チェック *****
            // ***** NaN対策 *****
            // (NaNの!=以外の比較はfalseになるので、そのとき無効になるように 条件を逆にしておく)
            // if (x1 < this.min_x || x1 > this.max_x || y1 < this.min_y || y1 > this.max_y) {
            if (!(x1 >= this.min_x && x1 <= this.max_x && y1 >= this.min_y && y1 <= this.max_y)) {
                // ***** 範囲外なら無効にする *****
                this.useflag = 0;
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
        this.speedrate = 1;  // 再生速度レート(=1:等倍)
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
        if (this.node == null) { return 0; }
        // ***** 再生状態を返す *****
        return this.node.playbackState;
    };
    // ***** 音量設定 *****
    MMLPlayer.prototype.setVolume = function (volume) {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** ゲイン(音量)設定 *****
        this.gain = volume / 100;
        if (this.gain < 0) { this.gain = 0; }
        if (this.gain > 1) { this.gain = 1; }
        if (this.gnode != null) {
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
        if (this.node != null) {
            this.node.playbackRate.value = this.speed_rate;
        }
        return true;
    };
    // ***** 再生 *****
    // (引数を非0にするとループ再生)
    MMLPlayer.prototype.play = function (repeat_flag) {
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
        this.gnode = MMLPlayer.adctx.createGainNode();
        this.gnode.gain.value = this.gain;
        this.node.connect(this.gnode);
        this.gnode.connect(MMLPlayer.adctx.destination);
        this.node.noteOn(0);
        return true;
    };
    // ***** 停止 *****
    MMLPlayer.prototype.stop = function () {
        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 未再生のチェック *****
        if (this.node == null) { return false; }
        // ***** 停止 *****
        this.node.noteOff(0);
        this.node.disconnect();
        this.node = null;
        this.gnode.disconnect();
        this.gnode = null;
        return true;
    };
    // ***** MMLを設定してコンパイルする *****
    MMLPlayer.prototype.setMML = function (mml_st) {
        var i;
        var tokens = []; // トークン(配列)
        var addata_len;  // 必要な音声バッファのサイズ
        var chdata_len;  // チャンネル1個の音声バッファのサイズ

        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 引数のチェック *****
        if (typeof (mml_st) == "undefined") { return false; }
        if (mml_st == null) { return false; }
        // ***** 停止 *****
        this.stop();
        // ***** コンパイル中にする *****
        this.compiled = 1;
        // ***** MMLをトークン分割 *****
        tokens = this.tokenize(mml_st);
        // ***** コンパイル(パス1) *****
        // (テンポ変更情報を抽出して、
        //  必要な音声バッファのサイズを計算可能とする)
        this.compile(tokens, 1);
        // ***** 実時間テーブル作成 *****
        this.makeTimeTable();
        // DebugShow("pos=" + JSON.stringify(this.pos) + "\n");
        // DebugShow("tempo_chg=" + JSON.stringify(this.tempo_chg) + "\n");
        // ***** 音声バッファの確保 *****
        addata_len = 0;
        for (i = 0; i < MMLPlayer.MAX_CH; i++) {
            chdata_len = MMLPlayer.SAMPLE_RATE * this.getRealTime(this.pos[i]);
            if (addata_len < chdata_len) { addata_len = chdata_len; }
        }
        if (addata_len == 0) { return false; } // DOMエラー対応
        this.adbuf = MMLPlayer.adctx.createBuffer(1, addata_len, MMLPlayer.SAMPLE_RATE);
        this.addata = this.adbuf.getChannelData(0);
        // ***** コンパイル(パス2) *****
        // (音声データの値を計算して、音声バッファに格納する)
        this.compile(tokens, 2);
        // ***** 音声データの範囲チェック *****
        for (i = 0; i < addata_len; i++) {
            if (this.addata[i] >  1) { this.addata[i] =  1; }
            if (this.addata[i] < -1) { this.addata[i] = -1; }
        }
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
        var bin_st;    // バイナリデータ文字列
        var mime_st;   // MIME文字列
        var uint8_arr; // バイナリデータ(型付配列)
        var self;      // this保存用

        // ***** Web Audio APIの存在チェック *****
        if (!MMLPlayer.AudioContext) { return false; }
        // ***** 引数のチェック *****
        if (typeof (aud_data_st) == "undefined") { return false; }
        if (aud_data_st == null) { return false; }
        // ***** 停止 *****
        this.stop();
        // ***** コンパイル中にする *****
        this.compiled = 1;
        // ***** 音楽データを設定 *****
        // (Base64の文字列をバイナリデータに変換してデコードする)
        bin_st = atob(aud_data_st.split(',')[1]);
        mime_st = aud_data_st.split(',')[0].split(':')[1].split(';')[0];
        uint8_arr = new Uint8Array(bin_st.length);
        for (i = 0; i < bin_st.length; i++) {
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
        // var t;       // 時間(sec)
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
            phase_c = 2 * PI * freq / MMLPlayer.SAMPLE_RATE;
            amp_c = volume / 127 / MMLPlayer.MAX_CH;
            pos_int = parseInt(MMLPlayer.SAMPLE_RATE * rtime1, 10);

            // ***** 音声データの値を計算 *****
            for (i = 0; i < nlen1; i++) {
                // phase = 2 * Math.PI * freq * i / MMLPlayer.SAMPLE_RATE;
                phase = phase_c * i;
                switch (prog) {
                    case 0:   // 方形波
                        wave = (Math.sin(phase) > 0) ? 1 : -1;
                        break;
                    case 1:   // 正弦波
                        wave = Math.sin(phase);
                        break;
                    case 2:   // のこぎり波
                        wave = (phase % (PI * 2)) / (PI * 2) * 2 - 1;
                        break;
                    case 3:   // 三角波
                        wave = Math.asin(Math.sin(phase)) / (PI / 2);
                        break;
                    case 4:   // ホワイトノイズ
                        wave = Math.random() * 2 - 1;
                        break;
                    case 500: // ピアノ(仮)
                        // t = i / MMLPlayer.SAMPLE_RATE;
                        wave = ((Math.sin(phase) > 0) ? 1 : -1) * Math.exp(-5 * (i / MMLPlayer.SAMPLE_RATE));
                        break;
                    default:  // 方形波
                        wave = (Math.sin(phase) > 0) ? 1 : -1;
                        break;
                }
                if (nlen2 == 0) {
                    fade = 1;
                } else {
                    if ((i / nlen2) < 0.8) {
                        fade = 1;
                    } else if (i < nlen2) {
                        fade = (1 - (i / nlen2)) / (1 - 0.8);
                    } else {
                        fade = 0;
                    }
                }
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
    MMLPlayer.prototype.compile = function (tokens, pass_no) {
        var tokens_len;     // トークン数
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
        var tempo_sort = function (a,b) { return (a.pos - b.pos); }; // ソート用(比較関数)
        // ***** その他の変数 *****
        var i, j;
        var index, note, nlength1, nlength2, val;
        var type_chr, data_chr, data_chr2;
        var loop_no, loop_count;

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
        // ***** トークンの解析 *****
        index = 0;
        tokens_len = tokens.length;
        while (index < tokens_len) {
            // ***** タイプとデータを取得 *****
            type_chr = tokens[index].charAt(0);
            data_chr = this.getTokenChar(tokens[index++]);
            // ***** タイプによって場合分け *****
            switch (type_chr) {
            case "1": // 数字
                break;
            case "2": // 音符と休符
                // ***** 音の高さを計算 *****
                if (data_chr == "r") {
                    // ***** 休符は音の高さなし *****
                    note = 0;
                } else {
                    // ***** 音符の音の高さを数値化 *****
                    note = "c d ef g a b".indexOf(data_chr);
                    // ***** オクターブを加算 *****
                    note = note + (octave[ch] + 1) * 12;
                    // ***** シャープ、フラット、ナチュラルがあるときはそれを計算 *****
                    switch (this.getTokenChar(tokens[index])) {
                    case "+": // シャープ
                    case "#": // シャープ
                        index++;
                        note++;
                        break;
                    case "-": // フラット
                        index++;
                        note--;
                        break;
                    case "=": // ナチュラル
                    case "*": // ナチュラル
                        index++;
                        break;
                    default:  // その他のときは調号の分を計算
                        val = "cdefgab".indexOf(data_chr);
                        if (val >= 0) { note = note + sharp[ch][val]; }
                        break;
                    }
                    // ***** 音の高さ範囲チェック *****
                    if (note < 0) { note = 0; }
                    if (note > 127) { note = 127; }
                }
                // ***** 音長の計算 *****
                // ***** 絶対音長があるときは絶対音長を取得 *****
                if (this.getTokenChar(tokens[index]) == "%") {
                    index++;
                    val = this.getTokenValue(tokens[index++]);
                    if (val < 0) { val = 0; }
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    nlength1 = val;
                } else {
                    // ***** 音長があるときは音長を取得 *****
                    val = this.getTokenValueForErr(tokens[index]);
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    if (val == 0) {
                        index++;
                        nlength1 = 0;
                    } else if (val > 0) {
                        index++;
                        nlength1 = 48 * 4 / val;
                    } else {
                        nlength1 = alength[ch];
                    }
                    // ***** 付点があるときは音長を1.5倍 *****
                    if (this.getTokenChar(tokens[index]) == ".") {
                        index++;
                        nlength1 = nlength1 * 3 / 2;
                    }
                }
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
                // ***** タイまたはスラーのとき *****
                if (this.getTokenChar(tokens[index]) == "&") {
                    index++;
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
                break;
            case "3": // その他の文字
                switch (data_chr) { // コマンドに応じて処理
                case "!": // 拡張コマンド
                    data_chr2 = this.getTokenChar(tokens[index++]);
                    switch (data_chr2) {
                    case "c": // チャンネル切替(0-(MAX_CH-1))
                        val = this.getTokenValue(tokens[index++]);
                        if (val < 0) { val = 0; }
                        if (val > (MMLPlayer.MAX_CH - 1)) { val = MMLPlayer.MAX_CH - 1; }
                        ch = val;
                        // ***** ループを解除 *****
                        // ***** (今の作りではチャンネル切り替えをまたぐループは不可) *****
                        loop[ch].begin = [];
                        loop[ch].end = [];
                        loop[ch].counter = [];
                        break;
                    case "o": // オクターブ記号変更(トグル)
                        if (oct_chg == 0) { oct_chg = 1; } else { oct_chg = 0; }
                        break;
                    case "v": // ボリューム最大値(1-1000)
                        val = this.getTokenValue(tokens[index++]);
                        if (val < 1) { val = 1; }
                        if (val > 1000) { val = 1000; } // エラーチェック追加
                        vol_max = val;
                        break;
                    case "+": // 調号シャープ
                    case "#": // 調号シャープ
                    case "-": // 調号フラット
                    case "=": // 調号ナチュラル
                    case "*": // 調号ナチュラル
                        do {
                            val = "cdefgab".indexOf(this.getTokenChar(tokens[index]));
                            if (val >= 0) {
                                index++;
                                if (data_chr2 == "+" || data_chr2 == "#") { sharp[ch][val] = 1; }
                                else if (data_chr2 == "-") { sharp[ch][val] = -1; }
                                else if (data_chr2 == "=" || data_chr2 == "*") { sharp[ch][val] = 0; }
                            }
                        } while (val >= 0);
                        break;
                    }
                    break;
                case "t": // テンポ切替(20-300) → (20-1200)
                    val = this.getTokenValue(tokens[index++]);
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
                        this.tempo_chg.sort(tempo_sort);
                    }
                    break;
                case "v": // チャンネル音量(0-vol_max)
                    val = this.getTokenValue(tokens[index++]);
                    if (val < 0) { val = 0; }
                    if (val > vol_max) { val = vol_max; }
                    volume[ch] = (val * 127) / vol_max; // 内部では音量は 0-127
                    // _track.setChannelVolume(ch, volume[ch]);
                    break;
                case "k": // ベロシティ(0-127)
                    val = this.getTokenValue(tokens[index++]);
                    if (val < 0) { val = 0; }
                    if (val > 127) { val = 127; }
                    velocity[ch] = val;
                    break;
                case "@": // 音色切替(0-1000)
                    val = this.getTokenValue(tokens[index++]);
                    if (val < 0) { val = 0; }
                    if (val > 1000) { val = 1000; } // エラーチェック追加
                    prog[ch] = val;
                    // _track.changeProg(ch, prog[ch]);
                    break;
                case "l": // 音長指定(0-1000)
                    // ***** 絶対音長があるときは絶対音長を取得 *****
                    if (this.getTokenChar(tokens[index]) == "%") {
                        index++;
                        val = this.getTokenValue(tokens[index++]);
                        if (val < 0) { val = 0; }
                        if (val > 1000) { val = 1000; } // エラーチェック追加
                        alength[ch] = val;
                    } else {
                        // ***** 音長を取得 *****
                        val = this.getTokenValue(tokens[index++]);
                        if (val < 0) { val = 0; }
                        if (val > 1000) { val = 1000; } // エラーチェック追加
                        if (val == 0) {
                            alength[ch] = 0;
                        } else {
                            alength[ch] = 48 * 4 / val;
                        }
                        // ***** 付点があるときは音長を1.5倍 *****
                        if (this.getTokenChar(tokens[index]) == ".") {
                            index++;
                            alength[ch] = alength[ch] * 3 / 2;
                        }
                    }
                    break;
                case "q": // 発音割合指定(1-8)
                    val = this.getTokenValue(tokens[index++]);
                    if (val < 1) { val = 1; }
                    if (val > 8) { val = 8; }
                    qtime[ch] = val;
                    break;
                case "o": // オクターブ指定(0-8)
                    val = this.getTokenValue(tokens[index++]);
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
                    loop[ch].begin.push(index);
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
                            index = loop[ch].end[loop_no];
                            // ***** ループ情報を破棄 *****
                            loop[ch].begin.pop();
                            loop[ch].end.pop();
                            loop[ch].counter.pop();
                        } else {
                            // ***** ループ初回のとき *****
                            if (loop_count == -1) {
                                // ***** ループ回数取得 *****
                                val = this.getTokenValueForErr(tokens[index]);
                                if (val > 100) { val = 100; } // エラーチェック追加
                                if (val >= 0) {
                                    index++;
                                    loop_count = val - 1;
                                }
                                if (loop_count <= 0) { loop_count = 1; }
                                // ***** ループ終了位置を保存 *****
                                loop[ch].end[loop_no] = index;
                            }
                            // ***** ループ先頭位置へジャンプ *****
                            index = loop[ch].begin[loop_no];
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
                            index = loop[ch].end[loop_no];
                            // ***** ループ情報を破棄 *****
                            loop[ch].begin.pop();
                            loop[ch].end.pop();
                            loop[ch].counter.pop();
                        }
                    }
                    break;
                }
                break;
            }
        }
        return true;
    };
    // ***** トークンを数値に変換して取得(内部処理用) *****
    MMLPlayer.prototype.getTokenValue = function (tok) {
        if (tok.length < 2) { return 0; }
        if (tok.charAt(0) == "1") { return parseInt(tok.substring(1), 10); }
        return 0;
    };
    // ***** トークンを数値に変換して取得(エラー時は-1を返す)(内部処理用) *****
    MMLPlayer.prototype.getTokenValueForErr = function (tok) {
        if (tok.length < 2) { return -1; }
        if (tok.charAt(0) == "1") { return parseInt(tok.substring(1), 10); }
        return -1;
    };
    // ***** トークンを文字に変換して取得(内部処理用) *****
    MMLPlayer.prototype.getTokenChar = function (tok) {
        if (tok.length < 2) { return 0; }
        return tok.charAt(1);
    };
    // ***** MMLをトークン分割(内部処理用) *****
    MMLPlayer.prototype.tokenize = function (mml_st) {
        var mml_str;     // MML文字列
        var mml_str_len; // MML文字列の長さ
        var index;       // 検索位置
        var tokens = []; // トークン(配列)
        var ch, type, start;

        // ***** 小文字に変換 *****
        mml_str = mml_st.toLowerCase();
        // ***** トークン切り出し *****
        index = 0;
        tokens = [];
        mml_str_len = mml_str.length;
        while (index < mml_str_len) {
            // ***** 1文字取り出す *****
            ch = mml_str.charAt(index);
            // ***** タイプを取得 *****
            if (ch == " " || ch == "\n" || ch == "\r" || ch == "\t") {
                type = 0;  // 無効
            } else if ("0123456789".indexOf(ch) >= 0) {
                type = 1;  // 数字
            } else if ("cdefgabr".indexOf(ch) >= 0) {
                type = 2;  // 音符と休符
            } else if (ch == "^") {
                type = 10; // 「^」記号
            } else {
                type = 3;  // その他の文字
            }
            // ***** 切り出し開始 *****
            start = index;
            index++;
            if (type == 1) { // 数字のときは数字でなくなるまで追加
                while (index < mml_str_len) {
                    ch = mml_str.charAt(index);
                    if ("0123456789".indexOf(ch) >= 0) {
                        index++;
                    } else {
                        break;
                    }
                }
                tokens.push(String(type) + mml_str.substring(start, index));
            } else if (type == 10) { // 「^」記号のときはタイと休符のトークンを追加
                tokens.push("3&");
                tokens.push("2r");
            } else if (type > 0) { // 無効文字以外をトークンに追加
                tokens.push(String(type) + mml_str.substring(start, index));
            }
        }
        // ***** 末尾に無効なトークンを追加(安全のため) *****
        tokens.push("3|");
        tokens.push("3|");
        tokens.push("3|");
        tokens.push("3|");
        // ***** トークンを返す *****
        return tokens;
    };
    return MMLPlayer; // これがないとクラスが動かないので注意
})();


