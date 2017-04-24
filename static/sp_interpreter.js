// -*- coding: utf-8 -*-

// sp_interpreter.js
// 2017-4-24 v9.04


// SPALM Web Interpreter
// Modified for Web Application, by H.H(Hamayama Hama).
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
//            ブラウザ関連処理等
// ****************************************

// ***** 汎用 *****
function Alm(msg) {
    // alert(msg);
}
function Alm2(msg) {
    alert(msg);
}
function DebugShow(msg) {
    document.getElementById("debug_show1").appendChild(document.createTextNode(msg));
}
function DebugShowClear() {
    document.getElementById("debug_show1").innerHTML = "";
}
function BrowserType() {
    var ua = window.navigator.userAgent;
    if (ua.indexOf("Opera") >= 0)   { return "Opera"; }   // MSIEより前にチェックが必要
    if (ua.indexOf("MSIE") >= 0)    { return "MSIE"; }
    if (ua.indexOf("Trident") >= 0) { return "MSIE"; }    // IE11対策
    if (ua.indexOf("Chrome") >= 0)  { return "Chrome"; }  // Safariより前にチェックが必要
    if (ua.indexOf("Safari") >= 0)  { return "Safari"; }
    if (ua.indexOf("Firefox") >= 0) { return "Firefox"; }
    return "";
}

// ***** 初期化 *****
function init_func(load_skip_flag) {
    var list_id;

    // ***** FlashCanvas用 *****
    if (typeof (FlashCanvas) != "undefined") {
        DebugShow("FlashCanvas mode.\n");
    } else {
        DebugShow("Native canvas mode.\n");
    }
    // ***** インタープリターの初期化 *****
    Interpreter.init();
    Interpreter.setrunstatcallback(show_runstat);
    // ***** プログラムリストの読み込み *****
    if (!load_skip_flag) {
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
    }
    // ***** デバッグモードの初期選択 *****
    if (get_one_url_para("debug") == "1") {
        document.getElementById("debug_chk1").checked = true;
    }
}

// ***** URLパラメータ1個の取得 *****
function get_one_url_para(key) {
    var ret;
    var i, pos, key2, val;
    var para_st, para;

    // ***** 戻り値の初期化 *****
    ret = "";
    // ***** 引数のチェック *****
    if (key == null) { Alm("get_one_url_para:0001"); return ret; }
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
    if (id == null) { Alm("check_id:0001"); return ret; }
    if (num == null) { Alm("check_id:0002"); return ret; }
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
    var list_st_len;
    var prog_id = [];
    var prog_id_count;
    var split_flag;

    // ***** 戻り値の初期化 *****
    prog_id_count = 0;
    prog_id[prog_id_count] = "";
    // ***** 引数のチェック *****
    if (list_st == null) { Alm("get_prog_id:0001"); return prog_id; }
    if (list_st == "") { Alm("get_prog_id:0002"); return prog_id; }
    // ***** テキストの分解 *****
    split_flag = false;
    i = 0;
    list_st_len = list_st.length;
    while (i < list_st_len) {
        // ***** 1文字取り出す *****
        ch = list_st.charAt(i++);
        ch2 = list_st.charAt(i);
        // ***** 空白かTABのとき *****
        if (ch == " " || ch == "\t") { split_flag = true; }
        // ***** 改行のとき *****
        if (ch == "\r" || ch == "\n") {
            split_flag = true;
            if (ch == "\r" && ch2 == "\n") { i++; }
        }
        // ***** コメント「;」のとき *****
        if (ch == ";") {
            split_flag = true;
            while (i < list_st_len) {
                // ***** 1文字取り出す *****
                ch = list_st.charAt(i++);
                ch2 = list_st.charAt(i);
                // ***** 改行のとき *****
                if (ch == "\r" || ch == "\n") {
                    if (ch == "\r" && ch2 == "\n") { i++; }
                    break;
                }
            }
        }
        // ***** プログラムIDの取得 *****
        if (split_flag) {
            split_flag = false;
            if (check_id(prog_id[prog_id_count], 8)) { prog_id_count++; }
            prog_id[prog_id_count] = "";
        } else {
            prog_id[prog_id_count] += ch;
        }
    }
    // ***** 最後のIDをチェック *****
    if (!check_id(prog_id[prog_id_count], 8)) { prog_id.pop(); }
    // ***** 戻り値を返す *****
    return prog_id;
}

// ***** リストファイルの読み込み *****
function load_listfile(fname, err_show_flag) {
    var ret;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (fname == null) { Alm("load_listfile:0001"); return ret; }
    if (fname == "") { Alm("load_listfile:0002"); return ret; }
    if (err_show_flag == null) { Alm("load_listfile:0003"); return ret; }
    // ***** 要素の存在チェック *****
    if (!document.getElementById("prog_sel1")) { Alm("load_listfile:0004"); return ret; }
    // ***** テキストファイルの読み込み *****
    load_textfile(fname, function (list_st) {
        var i, prog_id, elm;
        // ***** プログラムID(複数)の取得 *****
        prog_id = get_prog_id(list_st);
        // ***** プログラムリストに追加 *****
        elm = document.getElementById("prog_sel1");
        elm.length = 0;
        for (i = 0; i < prog_id.length; i++) {
            elm.length++;
            elm.options[elm.length - 1].value = prog_id[i];
            elm.options[elm.length - 1].text  = prog_id[i];
        }
    }, function (err_st) {
        if (err_show_flag) { Alm2("load_listfile:" + err_st + ":リストファイル読み込みエラー"); }
    });
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** ソースファイルの読み込み *****
function load_srcfile(fname) {
    var ret;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (fname == null) { Alm("load_srcfile:0001"); return ret; }
    if (fname == "") { Alm("load_srcfile:0002"); return ret; }
    // ***** 要素の存在チェック *****
    if (!document.getElementById("src_text1")) { Alm("load_srcfile:0004"); return ret; }
    // ***** ロード中にする *****
    Interpreter.setloadstat(1);
    // ***** テキストファイルの読み込み *****
    load_textfile(fname, function (src_st) {
        // ***** ロード中を解除(ロード完了) *****
        Interpreter.setloadstat(2);
        // ***** テキストボックスにセット *****
        document.getElementById("src_text1").value = src_st;
        // ***** スクロールを先頭に移動 *****
        if (document.getElementById("src_text1").scrollTop) {
            document.getElementById("src_text1").scrollTop = 0;
        }
    }, function (err_st) {
        Alm2("load_srcfile:" + err_st + ":ソースファイル読み込みエラー");
        // ***** ロード中を解除 *****
        Interpreter.setloadstat(0);
    });
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** テキストファイルの読み込み *****
function load_textfile(fname, ok_func, ng_func) {
    var ret;
    var http_obj;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (fname == null) { Alm("load_textfile:0001"); return ret; }
    if (fname == "") { Alm("load_textfile:0002"); return ret; }
    if (typeof (ok_func) != "function") { Alm("load_textfile:0003"); return ret; }
    if (typeof (ng_func) != "function") { Alm("load_textfile:0004"); return ret; }
    // ***** テキストファイルの読み込み *****
    http_obj = createXMLHttpObject();
    if (!http_obj) { ng_func("-"); return ret; }
    http_obj.onreadystatechange = function () {
        var data_st;
        // ***** IE8対策 *****
        // if (http_obj.readyState == 4 && http_obj.status == 200) {
        if (http_obj.readyState == 4) {
            if (http_obj.status == 200 || http_obj.status == 0) {
                data_st = http_obj.responseText;
                if (data_st) { ok_func(data_st); }
                else { ng_func("+"); }
            } else { ng_func("*"); }
        }
    };
    // ***** IE11対策 *****
    // http_obj.open("GET", fname, true);
    try {
        http_obj.open("GET", fname, true);
    } catch (ex1) {
        ng_func("=");
        return ret;
    }
    // HTTP/1.0 における汎用のヘッダフィールド
    http_obj.setRequestHeader("Pragma", "no-cache");
    // HTTP/1.1 におけるキャッシュ制御のヘッダフィールド
    http_obj.setRequestHeader("Cache-Control", "no-cache");
    // 指定日時以降に更新があれば内容を返し、更新がなければ304ステータスを返す
    // ヘッダフィールド。古い日時を指定すれば、必ず内容を返す。
    http_obj.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
    // ***** IE8対策 *****
    // http_obj.send(null);
    try { http_obj.send(null); } catch (ex2) { }
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
    if (!document.getElementById("dummy_button1")) { Alm("show_runstat:0006"); return ret; }
    // ***** プログラム実行状態の表示 *****
    if (Interpreter.getloadstat() == 1) {
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
    if (Interpreter.getrunstat() || Interpreter.getloadstat() == 1) {
        document.getElementById("run_button1").disabled = true;
        document.getElementById("load_button1").disabled = true;
        document.getElementById("prog_sel1").disabled = true;
        document.getElementById("src_text1").disabled = true;
        // ***** Firefox v26 対策 *****
        if (BrowserType() == "Firefox") {
            document.getElementById("dummy_button1").focus();
        }
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
    if (Interpreter.getloadstat() == 1) { Alm2("load_button:-:プログラムロード中です。"); return ret; }
    // ***** ソースファイルの読み込み *****
    prog_id = document.getElementById("prog_sel1").options[document.getElementById("prog_sel1").selectedIndex].value;
    if (!check_id(prog_id, 8)) { Alm("load_button:0003"); return ret; }
    load_srcfile("prog" + prog_id + ".txt");
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
    if (Interpreter.getloadstat() == 1) { Alm2("run_button:-:プログラムロード中です。"); return ret; }
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
//             インタープリター
// ****************************************

// ***** Interpreter(名前空間) *****
//
// 公開I/F :
//
//   Interpreter.init()        初期化
//
//   Interpreter.run(src_st)   実行
//     src_st     プログラムのソース
//
//   Interpreter.stop()        停止
//
//   Interpreter.getrunstat()  実行状態取得
//     戻り値     =true:実行中,=false:停止
//
//   Interpreter.setrunstatcallback(cb_func)  実行状態通知
//     cb_func    コールバック関数(状態変化時に呼ばれる関数を指定する)
//
//   Interpreter.setloadstat(load_stat)  ロード中状態設定
//     load_stat  =0:非ロード中,=1:ロード中,=2:ロード完了
//
//   Interpreter.getloadstat()  ロード中状態取得
//     戻り値     =0:非ロード中,=1:ロード中,=2:ロード完了
//
//   Interpreter.setdebug(dbg_mode)  デバッグ用
//     dbg_mode   =0:通常モード,=1:デバッグモード
//
//   Interpreter.setcolor(can1_forecolor, can1_backcolor, can2_forecolor, can2_backcolor)  色設定
//     can1_forecolor  Canvasの文字色を文字列で指定する("#ffffff" 等。""なら設定しない)
//     can1_backcolor  Canvasの背景色を文字列で指定する("#707070" 等。""なら設定しない)
//     can2_forecolor  ソフトキー表示エリアの文字色を文字列で指定する("#ffffff" 等。""なら設定しない)
//     can2_backcolor  ソフトキー表示エリアの背景色を文字列で指定する("#707070" 等。""なら設定しない)
//
//   Interpreter.setoutdata(no, data)  外部データ設定
//   Interpreter.getoutdata(no)        外部データ取得
//
// その他 情報等 :
//
//   各命令の定義は make_func_tbl の中で行っています。
//   また、新しい命令の追加は、別ファイルのプラグインで行うことを想定しています。
//
//   内部クラス一覧
//     Vars        変数用クラス(staticクラス)
//
//   外部クラス一覧
//     Download    ファイルダウンロード用クラス(staticクラス)
//     Profiler    プロファイラ用クラス
//
var Interpreter;
(function (Interpreter) {
    var max_array_size = 10000; // 処理する配列の個数最大値
    var max_str_size = 10000;   // 処理する文字数最大値
    var max_image_size = 4000;  // 画像の縦横のサイズ最大値(px)
    var max_scale_size = 1000;  // 座標系の倍率最大値
    var max_font_size = 1000;   // フォントサイズの最大値(px)
    var max_font_size2 = 16;    // ソフトキー表示エリアのフォントサイズの最大値(px)

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
    var can2_font_size_init = 16;        // ソフトキー表示エリアのフォントサイズ(px)の初期値
    var can;                    // 現在の描画先のCanvas要素
    var ctx;                    // 現在の描画先のCanvasコンテキスト
    var axis = {};              // 座標系情報(連想配列オブジェクト)
    var font_size;              // フォントサイズ(px)
    var color_val;              // 色設定
    var line_width;             // 線の幅(px)
    // ***** FlashCanvas Pro (将来用) で monospace が横長のフォントになるので削除 *****
    // var font_family = "'MS Gothic', Osaka-Mono, monospace"; // フォント指定
    var font_family = "'MS Gothic', Osaka-Mono"; // フォント指定
    var font_size_set = [12, 16, 24, 30]; // フォントサイズの設定値(px)(最小,小,中,大の順)

    var src;                    // ソース            (文字列)
    var token = [];             // トークン          (配列)
    var token_line = [];        // トークンが何行目か(配列)(エラー表示用)
    var token_len;              // トークン数        (token.lengthのキャッシュ用)
    var code = [];              // コード            (配列)
    var code_info = [];         // コード情報        (配列)(エラー表示用)
    var code_str = [];          // コード文字列      (配列)(表示用とアドレス解決時用)
    var code_len;               // コード数          (code.lengthのキャッシュ用)
    // var vars = {};           // 変数用            (Varsクラスに移行)
    var imgvars = {};           // 画像変数用        (連想配列オブジェクト)
    var label = {};             // ラベル用          (連想配列オブジェクト)
    var func = {};              // 関数用            (連想配列オブジェクト)
    var stack = [];             // スタック          (配列)
    var param = [];             // 関数の引数        (配列)(ユーザ定義関数のときは逆順に格納)
    var nothing = 0;            // 戻り値なしの組み込み関数の戻り値
    var end_token_num = 4;      // 終端のトークン数

    var pc;                     // プログラムカウンタ
    var debugpc;                // エラーの場所
    var end_flag;               // 終了フラグ
    var running_flag = false;   // 実行中フラグ
    var loading_mode = 0;       // ロード中モード(=0:非ロード中,=1:ロード中,=2:ロード完了)
    var debug_mode = 0;         // デバッグモード(=0:通常モード,=1:デバッグモード)
    var debugpos1;              // デバッグ位置1
    var debugpos2;              // デバッグ位置2
    var sleep_flag;             // スリープフラグ
    var sleep_time;             // スリープ時間(msec)
    var sleep_id = null;        // スリープキャンセル用ID
    var sleep_data = {};        // スリープ時間調整用(連想配列オブジェクト)
    var loop_time_max = 3000;   // 最大ループ時間(msec)(これ以上時間がかかったらエラーとする)
    var loop_time_start;        // ループ開始時間(msec)
    var loop_time_count;        // ループ経過時間(msec)
    var loop_nocount_flag1;     // ループ時間ノーカウントフラグ1(ダイアログや時間のかかる処理用)
    var loop_nocount_flag2;     // ループ時間ノーカウントフラグ2(dbgloopset用)
    var input_flag;             // キー入力待ちフラグ1(携帯互換用)
    var keyinput_flag;          // キー入力待ちフラグ2(PC用)
    var func_back = [];         // 関数の呼び出し元のスタック(配列)
    var gosub_back = [];        // gosubの呼び出し元のスタック(配列)

    var key_press_code;         // キープレスコード
    var key_down_code;          // キーダウンコード
    var key_down_stat = {};     // キーダウン状態(キーごと)(連想配列オブジェクト)
    var key_scan_stat;          // キースキャン状態(携帯互換用)
    var input_buf_size = 40;    // キー入力バッファのサイズ(文字数)
    var input_buf = [];         // キー入力バッファ1(携帯互換用)(配列)
    var keyinput_buf = [];      // キー入力バッファ2(PC用)(配列)
    var softkeys = [];          // ソフトキー情報(配列)

    var mousex;                 // マウスX座標(px)
    var mousey;                 // マウスY座標(px)
    var mouse_btn_stat = {};    // マウスボタン状態(ボタンごと)(連想配列オブジェクト)

    var sp_compati_flag;        // 互換モードフラグ
    var use_local_vars;         // ローカル変数使用有無
    var locstatement_flag;      // ローカル文フラグ
    var locvarnames_stack = []; // ローカル変数名情報のスタック(配列)
    var save_data = {};         // セーブデータ(連想配列オブジェクト)(仮)
    var prof_obj = {};          // プロファイラ実行用(Profilerクラスのインスタンス)
    var out_data = {};          // 外部データ(連想配列オブジェクト)

    var func_tbl = {};          // 組み込み関数の定義情報(連想配列オブジェクト)
    var addfunc_tbl = {};       // 追加の組み込み関数の定義情報(連想配列オブジェクト)
    var const_tbl = {};         // 定数の定義情報(連想配列オブジェクト)

    var before_run_funcs = {};  // プラグイン用の実行前処理(連想配列オブジェクト)
    var after_run_funcs = {};   // プラグイン用の実行後処理(連想配列オブジェクト)
    var clear_var_funcs = {};   // プラグイン用の全変数クリア時処理(連想配列オブジェクト)

    var constants = {           // 組み込み定数
        LEFT:4, HCENTER:1, RIGHT:8, TOP:16, VCENTER:2, BASELINE:64, BOTTOM:32,
        key0:1, key1:2, key2:4, key3:8, key4:16, key5:32, key6:64, key7:128, key8:256, key9:512,
        keystar:1024, keysharp:2048, keyup:4096, keyleft:8192, keyright:16384, keydown:32768,
        keyselect:65536, keysoft1:131072, keysoft2:262144,
        red:0xff0000, green:0x8000, blue:0xff, aqua:0xffff, yellow:0xffff00, gray:0x808080,
        white:0xffffff, black:0, navy:0x80, teal:0x8080, maroon:0x800000, purple:0x800080,
        olive:0x808000, silver:0xc0c0c0, lime:0xff00, fuchsia:0xff00ff };

    var phone_key_code = {      // 携帯のキーコードに変換するテーブル
        // [0]-[9] (テンキーも含める)
        48:  1      , 49: (1 << 1), 50: (1 << 2), 51: (1 << 3), 52: (1 << 4),
        53: (1 << 5), 54: (1 << 6), 55: (1 << 7), 56: (1 << 8), 57: (1 << 9),
        96:  1      , 97: (1 << 1), 98: (1 << 2), 99: (1 << 3), 100:(1 << 4),
        101:(1 << 5), 102:(1 << 6), 103:(1 << 7), 104:(1 << 8), 105:(1 << 9),
        // [*][#] は [z][x] にする
        90:(1 << 10), 88:(1 << 11),
        // [←][↑][→][↓]
        37:(1 << 13), // 12ではないので注意
        38:(1 << 12), // 13ではないので注意
        39:(1 << 14),
        40:(1 << 15),
        // 決定ボタン は スペースキーとEnterキーとCtrlキー にする
        32:(1 << 16), 13:(1 << 16), 17:(1 << 16),
        // [Soft1][Soft2] は [c][v] にする
        67:(1 << 17), 86:(1 << 18) };

    var opcode = {              // スタックマシンの命令コード
        push:1,        pop:2,         dup:3,         push0:4,       push1:5,
        load:6,        pointer:7,     array:8,       store:9,       preinc:10,
        predec:11,     postinc:12,    postdec:13,    add:14,        addstr:15,
        sub:16,        mul:17,        div:18,        divint:19,     mod:20,
        shl:21,        shr:22,        ushr:23,       positive:24,   negative:25,
        and:26,        or:27,         xor:28,        not:29,        lognot:30,
        cmpeq:31,      cmpne:32,      cmplt:33,      cmple:34,      cmpgt:35,
        cmpge:36,      label:37,      "goto":38,     ifgoto:39,     ifnotgoto:40,
        switchgoto:41, gosub:42,      "return":43,   func:44,       funcend:45,
        callfunc:46,   callwait:47,   callfunc2:48,  calluser:49,   callgoto:50,
        loadparam:51,  end:52 };

    var reserved = {            // 予約名
        "spmode":1,    "onlocal":2,   "offlocal":3,  "defconst":4,  "disconst":5,
        "label":6,     "goto":7,      "gosub":8,     "return":9,    "end":10,
        "global":11,   "glb":12,      "local":13,    "loc":14,      "func":15,
        "break":16,    "continue":17, "switch":18,   "case":19,     "default":20,
        "if":21,       "elsif":22,    "else":23,     "for":24,      "while":25,
        "do":26 };

    // ***** hasOwnPropertyをプロパティ名に使うかもしれない場合の対策 *****
    // (変数名、関数名、ラベル名、画像変数名について、
    //  obj.hasOwnProperty(prop) を hasOwn.call(obj, prop) に置換した)
    var hasOwn = Object.prototype.hasOwnProperty;

    // ***** 時間測定高速化用 *****
    // (new Date().getTime() より Date.now() の方が高速だが、
    //  Date.now() が存在しないブラウザもあるのでその対策)
    if (!Date.now) { Date.now = function () { return new Date().getTime(); }; }

    // ***** 小数切り捨て関数(ES6) *****
    if (!Math.trunc) {
        Math.trunc = function (x) { return (x < 0) ? Math.ceil(x) : Math.floor(x); };
    }

    // ***** 連想配列オブジェクトの初期化 *****
    // (Object.create(null) により、プロトタイプチェーンを無効にして、
    //  連想配列オブジェクトの検索を効率化する
    //  (ただし、常にヒットするような検索では性能は変わらない)
    //  (また、hasOwnProperty 等のメソッドは使用できなくなる))
    var hashInit = (function () {
        var f = Object.create ?
            function () { return Object.create(null); } :
            (function () {
                var F = function () {};
                F.prototype = null;
                return function () {
                    var r = new F();
                    if (r.__proto__) { r.__proto__ = null; }
                    return r;
                };
            })();
        return f;
    })();

    // ****************************************
    //                 公開I/F
    // ****************************************

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
        // ***** 組み込み関数の定義情報の初期化 *****
        func_tbl = {};
        // ***** 追加の組み込み関数の定義情報の初期化 *****
        addfunc_tbl = {};
        // ***** 組み込み関数の定義情報の生成 *****
        make_func_tbl();
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
        if (src_st == null) { Alm2("Interpreter.run:-:ソースがありません。"); return ret; }
        // if (src_st == "") { Alm2("Interpreter.run:+:ソースがありません。"); return ret; }
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
        end_flag = true;
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
        if (cb_func == null) { Alm("Interpreter.setrunstatcallback:0001"); return false; }
        if (typeof (cb_func) == "function") { runstatchanged = cb_func; }
    }
    Interpreter.setrunstatcallback = setrunstatcallback;

    // ***** ロード中状態設定 *****
    function setloadstat(load_stat) {
        if (load_stat == null) { Alm("Interpreter.setloadstat:0001"); return false; }
        loading_mode = load_stat;
        runstatchanged();
        if (loading_mode == 2) { loading_mode = 0; }
    }
    Interpreter.setloadstat = setloadstat;

    // ***** ロード中状態取得 *****
    function getloadstat() {
        return loading_mode;
    }
    Interpreter.getloadstat = getloadstat;

    // ***** デバッグ用 *****
    function setdebug(dbg_mode) {
        if (dbg_mode == null) { Alm("Interpreter.setdebug:0001"); return false; }
        debug_mode = dbg_mode;
    }
    Interpreter.setdebug = setdebug;

    // ***** 色設定 *****
    function setcolor(can1_forecolor, can1_backcolor, can2_forecolor, can2_backcolor) {
        if (can1_forecolor == null) { Alm("Interpreter.setcolor:0001"); return false; }
        if (can1_backcolor == null) { Alm("Interpreter.setcolor:0002"); return false; }
        if (can2_forecolor == null) { Alm("Interpreter.setcolor:0003"); return false; }
        if (can2_backcolor == null) { Alm("Interpreter.setcolor:0004"); return false; }
        if (can1_forecolor != "") { can1_forecolor_init = can1_forecolor; }
        if (can1_backcolor != "") { can1_backcolor_init = can1_backcolor; }
        if (can2_forecolor != "") { can2_forecolor_init = can2_forecolor; }
        if (can2_backcolor != "") { can2_backcolor_init = can2_backcolor; }
    }
    Interpreter.setcolor = setcolor;

    // ***** 外部データ設定 *****
    function setoutdata(no, data) {
        if (no == null) { Alm("Interpreter.setoutdata:0001"); return false; }
        if (data == null) { Alm("Interpreter.setoutdata:0002"); return false; }
        no |= 0;
        data = String(data);
        out_data[no] = data;
    }
    Interpreter.setoutdata = setoutdata;

    // ***** 外部データ取得 *****
    function getoutdata(no) {
        if (no == null) { Alm("Interpreter.getoutdata:0001"); return false; }
        no |= 0;
        if (out_data.hasOwnProperty(no)) { return out_data[no]; }
        return "";
    }
    Interpreter.getoutdata = getoutdata;


    // ***** 公開I/Fはここまで *****


    // ***** 以下は内部処理用 *****


    // ****************************************
    //                 実行処理
    // ****************************************
    // (コンパイルで生成したスタックマシンのコードを実行する)

    // ***** 実行開始 *****
    function run_start() {
        var ret;
        var msg;
        var name;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** Canvasのコンテキストを取得 *****
        ctx1 = can1.getContext("2d");
        ctx2 = can2.getContext("2d");
        // ***** Canvasのリサイズ *****
        can1.width  = can1_width_init;
        can1.height = can1_height_init;
        can2.width  = can2_width_init;
        can2.height = can2_height_init;
        can1.style.width  = can1_width_init  + "px";
        can1.style.height = can1_height_init + "px";
        can2.style.width  = can2_width_init  + "px";
        can2.style.height = can2_height_init + "px";
        // ***** Canvasの背景色設定 *****
        can1.style.backgroundColor = can1_backcolor_init;
        can2.style.backgroundColor = can2_backcolor_init;
        // ***** Canvasのクリア *****
        ctx1.clearRect(0, 0, can1.width, can1.height);
        ctx2.clearRect(0, 0, can2.width, can2.height);
        // ***** フォントサイズの初期化 *****
        font_size = font_size_set[1];
        // ctx2.font = can2_font_size_init + "px " + font_family;
        // ***** Canvasの各種設定の初期化 *****
        init_canvas_setting(ctx1);
        // ***** 現在の描画先にセット *****
        can = can1;
        ctx = ctx1;
        // ***** ソフトキー表示 *****
        softkeys[0] = {};
        softkeys[1] = {};
        softkeys[0].text = "";
        softkeys[1].text = "";
        softkeys[0].font_size = can2_font_size_init;
        softkeys[1].font_size = can2_font_size_init;
        disp_softkeys();
        // ***** デバッグ表示クリア *****
        DebugShowClear();
        // ***** 実行開始 *****
        DebugShow("実行開始\n");
        // ***** トークン分割 *****
        try {
            tokenize();
        } catch (ex1) {
            DebugShow("token:(" + token_len + "個): ");
            msg = token.join(" ");
            DebugShow(msg + "\n");
            DebugShow("tokenize: " + ex1.message + "\n");
            debugpos1 = token_len - 1;
            if (debugpos1 < 0) { debugpos1 = 0; }
            msg = "エラー場所: " + token_line[debugpos1] + "行";
            DebugShow(msg + "\n");
            DebugShow("実行終了\n");
            return ret;
        }
        // ***** プリプロセス *****
        try {
            preprocess();
        } catch (ex2) {
            DebugShow("token:(" + token_len + "個): ");
            msg = token.join(" ");
            DebugShow(msg + "\n");
            DebugShow("preprocess: " + ex2.message + ": debugpos=" + debugpos1 + "\n");
            show_err_place(debugpos1, debugpos2);
            DebugShow("実行終了\n");
            return ret;
        }
        // ***** コンパイル *****
        debugpos1 = 0;
        debugpos2 = 0;
        try {
            compile();
        } catch (ex3) {
            DebugShow("token:(" + token_len + "個): ");
            msg = token.join(" ");
            DebugShow(msg + "\n");
            DebugShow("code :(" + code_len + "個): ");
            msg = code_str.join(" ");
            DebugShow(msg + "\n");
            DebugShow("compile: " + ex3.message + ": debugpos=" + debugpos1 + "\n");
            show_err_place(debugpos1, debugpos2);
            DebugShow("実行終了\n");
            return ret;
        }
        if (debug_mode == 1) {
            DebugShow("token:(" + token_len + "個): ");
            msg = token.join(" ");
            DebugShow(msg + "\n");
            DebugShow("code :(" + code_len + "個): ");
            msg = code_str.join(" ");
            DebugShow(msg + "\n");
        }
        // ***** アドレス解決 *****
        debugpos1 = 0;
        debugpos2 = 0;
        try {
            resolveaddress();
        } catch (ex4) {
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("resolveaddress: " + ex4.message + ": debugpos=" + debugpos1 + "\n");
            show_err_place(debugpos1, debugpos2);
            DebugShow("実行終了\n");
            return ret;
        }
        // if (debug_mode == 1) {
        //     DebugShow("code2:(" + code_len + "個): " + JSON.stringify(code, function (k, v) {
        //         var func_name;
        //         if (typeof (v) == "function") { 
        //             func_name = code_str[(+k)];
        //             func_name = func_name.substring(1, func_name.length - 1);
        //             return "func\\" + func_name;
        //         }
        //         return v;
        //     }) + "\n");
        // }
        // ***** 実行 *****
        // vars = {};
        Vars.init();
        imgvars = {};
        stack = [];
        param = [];
        pc = 0;
        debugpc = 0;
        end_flag = false;
        running_flag = true; runstatchanged();
        sleep_flag = false;
        sleep_data = {};
        loop_nocount_flag1 = false;
        loop_nocount_flag2 = false;
        input_flag = false;
        keyinput_flag = false;
        func_back = [];
        gosub_back = [];
        key_press_code = 0;
        key_down_code = 0;
        key_down_stat = {};
        key_scan_stat = 0;
        input_buf = [];
        keyinput_buf = [];
        mousex = -10000;
        mousey = -10000;
        mouse_btn_stat = {};
        save_data = {};
        prof_obj = null;
        if (typeof (Profiler) == "function") { prof_obj = new Profiler(); }
        // ***** プラグイン用の実行前処理 *****
        for (name in before_run_funcs) {
            if (before_run_funcs.hasOwnProperty(name)) {
                before_run_funcs[name]();
            }
        }
        if (prof_obj) { prof_obj.start("result"); }

        // run_continuously();
        setTimeout(run_continuously, 10);

        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** 実行 *****
    // (本関数は再帰的に呼び出される)
    function run_continuously() {
        var ret;
        var name;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** コード実行開始 *****
        sleep_id = null;
        try {
            // ***** コード実行 *****
            // if (prof_obj) { prof_obj.start("execcode"); }
            execcode();
            // if (prof_obj) { prof_obj.stop("execcode"); }
            // ***** スリープ後に実行を継続(再帰的に実行) *****
            if (sleep_flag) {
                sleep_flag = false;
                if (!end_flag) {
                    sleep_id = setTimeout(run_continuously, sleep_time);
                    return ret;
                }
            }
        } catch (ex) {
            // ***** エラー終了 *****
            if (prof_obj) { prof_obj.stop("result"); }
            // ***** プラグイン用の実行後処理 *****
            for (name in after_run_funcs) {
                if (after_run_funcs.hasOwnProperty(name)) {
                    after_run_funcs[name]();
                }
            }
            // ***** エラー表示 *****
            debugpos1 = code_info[debugpc].pos1;
            debugpos2 = code_info[debugpc].pos2;
            DebugShow("execcode: " + ex.message + ": debugpos=" + debugpos1 + ", debugpc=" + debugpc + "\n");
            show_err_place(debugpos1, debugpos2);
            // ***** 終了処理 *****
            running_flag = false; runstatchanged();
            DebugShow("実行終了\n");
            DebugShow("globalvars=" + JSON.stringify(Vars.getGlobalVars()) + "\n");
            DebugShow("localvars=" + JSON.stringify(Vars.getLocalVars()) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("stack=" + JSON.stringify(stack) + "\n");
            if (prof_obj && Profiler.MicroSecAvailable) { DebugShow(prof_obj.getAllResult()); }
            // ***** 戻り値を返す *****
            return ret;
        }
        // ***** 正常終了 *****
        if (prof_obj) { prof_obj.stop("result"); }
        // ***** プラグイン用の実行後処理 *****
        for (name in after_run_funcs) {
            if (after_run_funcs.hasOwnProperty(name)) {
                after_run_funcs[name]();
            }
        }
        // ***** 終了処理 *****
        running_flag = false; runstatchanged();
        DebugShow("実行終了\n");
        if (debug_mode == 1) {
            DebugShow("globalvars=" + JSON.stringify(Vars.getGlobalVars()) + "\n");
            DebugShow("localvars=" + JSON.stringify(Vars.getLocalVars()) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("stack=" + JSON.stringify(stack) + "\n");
        }
        if (prof_obj && Profiler.MicroSecAvailable) { DebugShow(prof_obj.getAllResult()); }
        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** コード実行 *****
    function execcode() {
        var i;
        var cod;
        var num, num2;
        var var_obj;
        var var_obj2;
        var param_num;
        var func_body;
        var func_name;
        var func_start;
        var time_cnt;

        // ***** コード実行のループ *****
        loop_time_start = Date.now();
        time_cnt = 0;
        while (pc < code_len) {
            // ***** コードを取り出す *****
            debugpc = pc;
            cod = code[pc++];
            // ***** スタックマシンのコードを実行 *****
            switch (cod) {
                // ( case opcode.xxx: が遅かったので数値を直接指定する)
                case 1: // push
                    num = code[pc++];
                    stack.push(num);
                    break;
                case 2: // pop
                    stack.pop();
                    break;
                case 3: // dup
                    // num = stack.pop();
                    // stack.push(num);
                    // stack.push(num);
                    num = stack[stack.length - 1];
                    stack.push(num);
                    break;
                case 4: // push0
                    stack.push(0);
                    break;
                case 5: // push1
                    stack.push(1);
                    break;
                case 6: // load
                    num = stack.pop();
                    var_obj = stack.pop();
                    Vars.setVarValue(var_obj, num);
                    stack.push(num);
                    break;
                case 7: // pointer
                    var_obj = stack.pop();
                    var_obj2 = Vars.getVarValue(var_obj);
                    if (var_obj2.kind == null) {
                        throw new Error("ポインタの指す先が不正です。(変数のアドレスではなく、'" + var_obj2 + "' が入っていました)");
                    }
                    stack.push(var_obj2);
                    break;
                case 8: // array
                    num = stack.pop();
                    var_obj = stack.pop();
                    var_obj2 = duplicate_var_obj(var_obj); // 変数オブジェクトを変更する場合は複製が必要
                    var_obj2.name = var_obj.name + "$" + num;
                    stack.push(var_obj2);
                    break;
                case 9: // store
                    var_obj = stack.pop();
                    num = Vars.getVarValue(var_obj);
                    stack.push(num);
                    break;
                case 10: // preinc
                    var_obj = stack.pop();
                    num = Vars.getVarValue(var_obj);
                    num++;
                    Vars.setVarValue(var_obj, num);
                    stack.push(num);
                    break;
                case 11: // predec
                    var_obj = stack.pop();
                    num = Vars.getVarValue(var_obj);
                    num--;
                    Vars.setVarValue(var_obj, num);
                    stack.push(num);
                    break;
                case 12: // postinc
                    var_obj = stack.pop();
                    num = Vars.getVarValue(var_obj);
                    stack.push(num);
                    num++;
                    Vars.setVarValue(var_obj, num);
                    break;
                case 13: // postdec
                    var_obj = stack.pop();
                    num = Vars.getVarValue(var_obj);
                    stack.push(num);
                    num--;
                    Vars.setVarValue(var_obj, num);
                    break;
                case 14: // add
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (+num) + (+num2); // 文字の連結にならないように数値にする
                    stack.push(num);
                    break;
                case 15: // addstr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = String(num) + String(num2);
                    stack.push(num);
                    break;
                case 16: // sub
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num - num2;
                    stack.push(num);
                    break;
                case 17: // mul
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num * num2;
                    stack.push(num);
                    break;
                case 18: // div
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num / num2;
                    stack.push(num);
                    break;
                case 19: // divint
                    num2 = stack.pop();
                    num = stack.pop();
                    num = Math.trunc(num / num2);
                    stack.push(num);
                    break;
                case 20: // mod
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num % num2;
                    stack.push(num);
                    break;
                case 21: // shl
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num << num2;
                    stack.push(num);
                    break;
                case 22: // shr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num >> num2;
                    stack.push(num);
                    break;
                case 23: // ushr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num >>> num2;
                    stack.push(num);
                    break;
                case 24: // positive
                    num = stack.pop();
                    num = +num;
                    stack.push(num);
                    break;
                case 25: // negative
                    num = stack.pop();
                    num = -num;
                    stack.push(num);
                    break;
                case 26: // and
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num & num2;
                    stack.push(num);
                    break;
                case 27: // or
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num | num2;
                    stack.push(num);
                    break;
                case 28: // xor
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num ^ num2;
                    stack.push(num);
                    break;
                case 29: // not
                    num = stack.pop();
                    num = ~num;
                    stack.push(num);
                    break;
                case 30: // lognot
                    num = stack.pop();
                    num = (num == 0) ? 1 : 0;
                    stack.push(num);
                    break;
                case 31: // cmpeq
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num == num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 32: // cmpne
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num != num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 33: // cmplt
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num < num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 34: // cmple
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num <= num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 35: // cmpgt
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num > num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 36: // cmpge
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num >= num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 37: // label
                    pc++;
                    break;
                case 38: // goto
                    pc = code[pc];
                    break;
                case 39: // ifgoto
                    num = stack.pop();
                    if (num != 0) {
                        pc = code[pc];
                        break;
                    }
                    pc++;
                    break;
                case 40: // ifnotgoto
                    num = stack.pop();
                    if (num == 0) {
                        pc = code[pc];
                        break;
                    }
                    pc++;
                    break;
                case 41: // switchgoto
                    num2 = stack.pop();
                    num = stack[stack.length - 1]; // 条件不成立時は式の値を残す
                    if (num == num2) {
                        stack.pop();
                        pc = code[pc];
                        break;
                    }
                    pc++;
                    break;
                case 42: // gosub
                    gosub_back.push(pc + 1);
                    pc = code[pc];
                    break;
                case 43: // return
                    // ***** 関数内のとき *****
                    if (func_back.length > 0) {
                        // ***** ローカル変数のスコープを1個削除する *****
                        if (use_local_vars) { Vars.deleteLocalScope(); }
                        // ***** 呼び出し元に戻る *****
                        pc = func_back.pop();
                        break;
                    }
                    // ***** gosubのとき *****
                    if (gosub_back.length > 0) {
                        // ***** 戻り値を捨てる *****
                        stack.pop();
                        // ***** 呼び出し元に戻る *****
                        pc = gosub_back.pop();
                        break;
                    }
                    // ***** 呼び出し元がない *****
                    throw new Error("予期しない return が見つかりました。");
                    // break;
                case 44: // func
                    pc = code[pc];
                    break;
                case 45: // funcend
                    // ***** 関数内のとき *****
                    if (func_back.length > 0) {
                        // ***** 戻り値は0とする *****
                        stack.push(0);
                        // ***** ローカル変数のスコープを1個削除する *****
                        if (use_local_vars) { Vars.deleteLocalScope(); }
                        // ***** 呼び出し元に戻る *****
                        pc = func_back.pop();
                        break;
                    }
                    // ***** 呼び出し元がない *****
                    throw new Error("予期しない '}' が見つかりました。");
                    // break;
                case 46: // callfunc
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    param = [];
                    for (i = param_num - 1; i >= 0; i--) {
                        param[i] = stack.pop();
                    }
                    // ***** 関数の本体を取得 *****
                    func_body = stack.pop();
                    // ***** 組み込み関数の呼び出し *****
                    num = func_body(param);
                    stack.push(num);
                    break;
                case 47: // callwait
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    param = [];
                    for (i = param_num - 1; i >= 0; i--) {
                        param[i] = stack.pop();
                    }
                    // ***** 関数の本体を取得 *****
                    func_body = stack.pop();
                    // ***** 組み込み関数の呼び出し *****
                    num = func_body(param);
                    // ***** 入力待ち状態でなければ完了 *****
                    if (!(input_flag || keyinput_flag)) {
                        stack.push(num);
                        break;
                    }
                    // ***** 同じ命令を繰り返す *****
                    stack.push(func_body);
                    for (i = 0; i < param_num; i++) {
                        stack.push(param[i]);
                    }
                    pc -= 2;
                    break;
                case 48: // callfunc2
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    param = [];
                    for (i = param_num - 1; i >= 0; i--) {
                        param[i] = stack.pop();
                    }
                    // ***** 関数の本体を取得 *****
                    func_body = stack.pop();
                    // ***** 追加の組み込み関数の呼び出し *****
                    num = func_body(param);
                    stack.push(num);
                    break;
                case 49: // calluser
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[i] = stack.pop(); // 逆順に格納
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    func_name = to_global(func_name); // 関数ポインタ対応
                    // ***** 関数の存在チェック *****
                    // if (!func.hasOwnProperty(func_name)) {
                    // if (!hasOwn.call(func, func_name)) {
                    func_start = func[func_name];
                    if (func_start == null) {
                        throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(関数が未定義もしくはユーザ定義関数ではない等)。");
                    }
                    // ***** ローカル変数のスコープを1個生成する *****
                    if (use_local_vars) { Vars.makeLocalScope(); }
                    // ***** 関数の呼び出し元を保存 *****
                    func_back.push(pc);
                    // ***** 関数の呼び出し *****
                    // pc = func[func_name];
                    pc = func_start;
                    break;
                case 50: // callgoto
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[i] = stack.pop(); // 逆順に格納
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    func_name = to_global(func_name); // 関数ポインタ対応
                    // ***** 関数内のとき *****
                    if (func_back.length > 0) {
                        // ***** 関数の存在チェック *****
                        // if (!func.hasOwnProperty(func_name)) {
                        // if (!hasOwn.call(func, func_name)) {
                        func_start = func[func_name];
                        if (func_start == null) {
                            throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(関数が未定義もしくはユーザ定義関数ではない等)。");
                        }
                        // ***** コールスタックを増加させないで関数を呼び出す *****
                        // ***** ローカル変数を削除する *****
                        if (use_local_vars) { Vars.clearLocalVars(); }
                        // ***** 関数の呼び出し *****
                        // pc = func[func_name];
                        pc = func_start;
                        break;
                    }
                    // ***** 関数の外では使用不可 *****
                    throw new Error("funcgoto はユーザ定義の関数内でなければ使用できません。");
                    // break;
                case 51: // loadparam
                    if (param.length > 0) {
                        num = param.pop(); // 逆順に取得
                    } else {
                        num = 0;
                    }
                    var_obj = stack.pop();
                    // ***** 関数の引数のポインタ対応 *****
                    if (use_local_vars && (var_obj.kind & 8)) {
                        if (num.kind == null) {
                            throw new Error("ポインタの指す先が不正です。(変数のアドレスではなく、'" + num + "' が入っていました)");
                        }
                        if (!(num.kind & 2) && (num.kind & 1)) {
                            // (関数の引数かつポインタ)
                            var_obj2 = duplicate_var_obj(num); // 変数オブジェクトを変更する場合は複製が必要
                            var_obj2.kind |= 2;
                            var_obj2.scope = Vars.getLocalScopeNum() - 1;
                            Vars.setVarValue(var_obj, var_obj2);
                            break;
                        }
                    }
                    Vars.setVarValue(var_obj, num);
                    break;
                case 52: // end
                    end_flag = true;
                    break;
                default:
                    // ***** 命令コードエラー *****
                    throw new Error("未定義の命令コード (" + cod + ") が見つかりました。");
                    // break;
            }
            // ***** 各種フラグのチェックと処理時間の測定 *****
            if (loop_nocount_flag1) {
                // (ループ時間ノーカウントフラグ2がOFFのときは、処理時間の測定をリセットする)
                if (!loop_nocount_flag2) {
                    loop_nocount_flag1 = false;
                    // loop_time_start = new Date().getTime();
                    loop_time_start = Date.now();
                }
            } else {
                // (Date.now()が遅かったので10回に1回だけ測定する)
                time_cnt++;
                if (time_cnt >= 10) {
                    time_cnt = 0;
                    // loop_time_count = new Date().getTime() - loop_time_start;
                    loop_time_count = Date.now() - loop_time_start;
                    if (loop_time_count >= loop_time_max) {
                        throw new Error("処理時間オーバーです(" + loop_time_max + "msec以上ブラウザに制御が返らず)。ループ内でsleep関数の利用を検討ください。");
                    }
                }
            }
            if (end_flag || sleep_flag) { break; }
        }
    }

    // ****************************************
    //             アドレス解決処理
    // ****************************************
    // (コンパイルで生成したラベル等のアドレスを解決する)

    // ***** アドレス解決 *****
    function resolveaddress() {
        var i, i2;
        var cod;
        var lbl_name;
        var func_name;
        var labelinfo = {};
        var funcinfo = {};
        var jumpinfo = {};
        var jumpinfo_array = [];

        // ***** コード解析のループ *****
        i = 0;
        // label = {};
        label = hashInit();
        // func = {};
        func = hashInit();
        func_name = "";
        jumpinfo_array = [];
        while (i < code_len) {
            // ***** コードを取り出す *****
            debugpos1 = code_info[i].pos1;
            // cod = code[i++];
            cod = code_str[i++];
            // ***** ラベルのとき *****
            if (cod == "label") {
                lbl_name = code[i++];
                // if (label.hasOwnProperty(lbl_name)) {
                // if (hasOwn.call(label, lbl_name)) {
                if (label[lbl_name] != null) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("ラベル '" + lbl_name + "' の定義が重複しています。");
                }
                label[lbl_name] = i;
                labelinfo[lbl_name] = {};
                labelinfo[lbl_name].func_name = func_name;
                continue;
            }
            // ***** 関数の定義開始のとき *****
            if (cod == "func") {
                if (func_name != "") {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("funcの中にfuncを入れることはできません。");
                }
                func_name = code[i++];
                // if (func.hasOwnProperty(func_name)) {
                // if (hasOwn.call(func, func_name)) {
                if (func[func_name] != null) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("関数 '" + func_name + "' の定義が重複しています。");
                }
                func[func_name] = i;
                funcinfo[func_name] = {};
                funcinfo[func_name].func_end = code_len - end_token_num; // 終了位置(仮)
                // ***** ジャンプ情報を生成 *****
                jumpinfo = {};
                jumpinfo.i = i - 1;
                jumpinfo.cod = cod;
                jumpinfo.debugpos1 = debugpos1;
                jumpinfo.lbl_name = "";
                jumpinfo.func_name = func_name;
                jumpinfo_array.push(jumpinfo);
                continue;
            }
            // ***** 関数の定義終了のとき *****
            if (cod == "funcend") {
                if (func_name != "") {
                    funcinfo[func_name].func_end = i; // 終了位置(確定)
                    func_name = ""; // 関数名をここでクリア
                }
                continue;
            }
            // ***** ジャンプのとき *****
            if (cod == "goto"       || cod == "ifgoto" || cod == "ifnotgoto" ||
                cod == "switchgoto" || cod == "gosub") {
                if (cod == "gosub" && func_name != "") {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("func内では gosub を使用できません。");
                }
                lbl_name = code[i++];
                // ***** ジャンプ情報を生成 *****
                jumpinfo = {};
                jumpinfo.i = i - 1;
                jumpinfo.cod = cod;
                jumpinfo.debugpos1 = debugpos1;
                jumpinfo.lbl_name = lbl_name;
                jumpinfo.func_name = func_name;
                jumpinfo_array.push(jumpinfo);
                continue;
            }
        }
        // ***** ジャンプ情報のアドレス解決 *****
        for (i2 = 0; i2 < jumpinfo_array.length; i2++) {
            jumpinfo = jumpinfo_array[i2];
            i = jumpinfo.i;
            cod = jumpinfo.cod;
            debugpos1 = jumpinfo.debugpos1;
            lbl_name = jumpinfo.lbl_name;
            func_name = jumpinfo.func_name;
            // ***** ジャンプのとき *****
            if (cod == "goto"       || cod == "ifgoto" || cod == "ifnotgoto" ||
                cod == "switchgoto" || cod == "gosub") {
                // ***** エラーチェック *****
                // if (!label.hasOwnProperty(lbl_name)) {
                // if (!hasOwn.call(label, lbl_name)) {
                if (label[lbl_name] == null) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                }
                if (func_name != labelinfo[lbl_name].func_name) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("funcの境界を越えてジャンプすることはできません。");
                }
                // ***** ジャンプ先のアドレスを設定 *****
                code[i] = label[lbl_name];
                continue;
            }
            // ***** 関数の定義開始のとき *****
            if (cod == "func") {
                // ***** 関数の定義終了のアドレスを設定 *****
                code[i] = funcinfo[func_name].func_end;
                continue;
            }
        }
    }

    // ****************************************
    //              コンパイル処理
    // ****************************************
    // (トークンを解析してスタックマシンのコードを生成する)

    // ***** コンパイル *****
    function compile() {
        // ***** 文(ステートメント)のコンパイル *****
        code = [];
        code_info = [];
        code_str = [];
        code_len = 0;
        locstatement_flag = false;
        locvarnames_stack = [];
        c_statement(0, token_len, "", "");
    }

    // ***** 文(ステートメント)のコンパイル *****
    function c_statement(tok_start, tok_end, break_lbl, continue_lbl) {
        var i, j, k, k2;
        var ch;
        var tok;
        var loc_flag;
        var var_name;
        var func_name, func_stm, func_end;
        var param_num;

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

        // ***** トークン解析のループ *****
        i = tok_start;
        while (i < tok_end) {
            // ***** トークンを取り出す *****
            debugpos1 = i;
            tok = token[i];

            // ***** セミコロンのとき *****
            if (tok == ";") {
                i++;
                continue;
            }

            // ***** spmode文のとき *****
            if (tok == "spmode") {
                i++;
                token_match("(", i++);
                // (符号のトークンを許可(特別扱い))
                if (isSign1(token[i])) { i++; }
                i++;
                token_match(")", i++);
                continue;
            }

            // ***** onlocal/offlocal文のとき *****
            if (tok == "onlocal" || tok == "offlocal") {
                i++;
                token_match("(", i++);
                token_match(")", i++);
                continue;
            }

            // ***** defconst文のとき *****
            if (tok == "defconst") {
                i++;
                token_match("(", i++);
                i++;
                token_match(",", i++);
                // (符号のトークンを許可(特別扱い))
                if (isSign1(token[i])) { i++; }
                i++;
                token_match(")", i++);
                continue;
            }

            // ***** disconst文のとき *****
            if (tok == "disconst") {
                i++;
                token_match("(", i++);
                i++;
                token_match(")", i++);
                continue;
            }

            // ***** label/goto/gosub文のとき *****
            if (tok == "label" || tok == "goto" || tok == "gosub") {
                i++;
                code_push(tok, debugpos1, i);
                // ***** ラベル名のコンパイル *****
                i = c_labelname(i);
                continue;
            }

            // ***** return文のとき *****
            if (tok == "return") {
                i++;
                // ***** 戻り値を取得 *****
                // (直後が } のときも戻り値なしとする(過去との互換性維持のため))
                // if (token[i] == ";") {
                if (token[i] == ";" || token[i] == "}") {
                    code_push("push0", debugpos1, i);
                } else {
                    i = c_expression(i, tok_end);
                }
                code_push("return", debugpos1, i);
                continue;
            }

            // ***** end文のとき *****
            if (tok == "end") {
                i++;
                code_push("end", debugpos1, i);
                continue;
            }

            // ***** global/glb/local/loc文のとき *****
            // (この文でグローバル/ローカル変数の宣言を行う)
            // (loc a,b,c のように、複数の変数をカンマ区切りで一括宣言可能とする)
            if (tok == "global" || tok == "glb" || tok == "local" || tok == "loc") {
                i++;
                loc_flag = (tok.charAt(0) == "l");
                while (i < tok_end) {
                    // ***** ローカル文フラグON *****
                    if (use_local_vars && loc_flag) { locstatement_flag = true; }
                    // ***** 因子のコンパイル *****
                    j = code_len + 1;
                    i = c_factor(i, tok_end);
                    code_push("pop", debugpos1, i);
                    // ***** 変数名のチェック *****
                    if (j < code_len) {
                        var_name = to_global(code[j]);
                        checkvarname(var_name, i);
                    }
                    // ***** ローカル文フラグOFF *****
                    if (use_local_vars && loc_flag) { locstatement_flag = false; }
                    // ***** カンマ区切りのチェック *****
                    if (token[i] == ",") {
                        i++;
                        continue;
                    }
                    break;
                }
                continue;
            }

            // ***** func文のとき *****
            if (tok == "func") {
                i++;
                code_push("func", debugpos1, i);
                func_name = token[i++];
                // ***** 関数名のチェック *****
                ch = func_name.charAt(0);
                if (!(isAlpha1(ch) || ch == "_")) {
                    debugpos2 = i;
                    throw new Error("関数名が不正です。('" + func_name + "')");
                }
                if (reserved.hasOwnProperty(func_name) ||
                    func_tbl.hasOwnProperty(func_name) ||
                    addfunc_tbl.hasOwnProperty(func_name)) {
                    // (一部の関数定義エラーを発生させない(過去との互換性維持のため))
                    if (!(sp_compati_flag && func_name == "int")) {
                        debugpos2 = i;
                        throw new Error("名前 '" + func_name + "' は予約されています。関数の定義に失敗しました。");
                    }
                }
                code_push('"' + func_name + '"', debugpos1, i);
                // ***** ローカル変数名情報を1個生成する *****
                if (use_local_vars) {
                    locvarnames_stack.push({});
                }
                // ***** 仮引数 *****
                token_match("(", i++);
                if (token[i] == ")") {
                    i++;
                } else {
                    while (i < tok_end) {
                        // ***** 変数名のコンパイル2(関数の仮引数用) *****
                        i = c_varname2(i, tok_end);
                        code_push("loadparam", debugpos1, i);
                        if (token[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    token_match(")", i++);
                }
                // ***** 本体 *****
                token_match("{", i++);
                func_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match("}", i++);
                func_end = i;
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                i = c_statement(func_stm, func_end - 1, "", "");
                code_push("funcend", debugpos1, i);
                i = func_end;
                // ***** ローカル変数名情報を1個削除する *****
                if (use_local_vars) {
                    locvarnames_stack.pop();
                }
                continue;
            }

            // ***** funcgoto文のとき *****
            if (tok == "funcgoto") {
                i++;
                token_match("(", i++);
                func_name = token[i];
                // ***** 関数名または関数ポインタのチェック *****
                ch = func_name.charAt(0);
                if (!(isAlpha1(ch) || ch == "_" || ch == "*")) {
                    debugpos2 = i + 1;
                    throw new Error("関数名が不正です。('" + func_name + "')");
                }
                // ***** 変数名のコンパイル *****
                i = c_varname(i, tok_end);
                // ***** 引数の取得 *****
                token_match("(", i++);
                param_num = 0;
                if (token[i] == ")") {
                    i++;
                } else {
                    while (i < tok_end) {
                        i = c_expression(i, tok_end);
                        param_num++;
                        if (token[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    token_match(")", i++);
                }
                // ***** 関数の呼び出し *****
                code_push("callgoto", debugpos1, i);
                // ***** 引数の数を設定 *****
                code_push(param_num, debugpos1, i);
                token_match(")", i++);
                continue;
            }

            // ***** break文のとき *****
            if (tok == "break") {
                i++;
                if (break_lbl == "") {
                    debugpos2 = i;
                    throw new Error("予期しない break が見つかりました。");
                }
                code_push("goto", debugpos1, i);
                code_push(break_lbl, debugpos1, i);
                continue;
            }

            // ***** continue文のとき *****
            if (tok == "continue") {
                i++;
                if (continue_lbl == "") {
                    debugpos2 = i;
                    throw new Error("予期しない continue が見つかりました。");
                }
                code_push("goto", debugpos1, i);
                code_push(continue_lbl, debugpos1, i);
                continue;
            }

            // ***** switch文のとき *****
            // switch (式) { case 式: 文 ... case 式: 文 default: 文 }
            if (tok == "switch") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                token_match("(", i++);
                // 式
                switch_exp = i;
                k = 1;
                if (token[i] == ")") {
                    debugpos2 = i + 1;
                    throw new Error("switch文の条件式がありません。");
                }
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(")", i++);
                token_match("{", i++);
                // 文
                switch_stm = i;
                k = 1;
                switch_case_exp = [];
                switch_case_stm = [];
                switch_default_stm = -1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    if (k == 1) {
                        if (token[i] == "case") {
                            i++;
                            // 式
                            switch_case_exp.push(i);
                            if (token[i] == ":") {
                                debugpos2 = i + 1;
                                throw new Error("case文の値がありません。");
                            }
                            k2 = 1; // caseで式を使用可能とする
                            while (i < tok_end) {
                                if (token[i] == "?") { k2++; }
                                if (token[i] == ":") { k2--; }
                                if (k2 == 0) { break; }
                                i++;
                            }
                            token_match(":", i++);
                            // 文
                            switch_case_stm.push(i);
                            continue;
                        }
                        if (token[i] == "default") {
                            i++;
                            switch_case_exp.push(i); // caseの1個としても登録
                            token_match(":", i++);
                            // 文
                            switch_default_stm = i;
                            switch_case_stm.push(i); // caseの1個としても登録
                            continue;
                        }
                    }
                    i++;
                }
                token_match("}", i++);
                // 終了
                switch_end = i;
                // ***** コードの生成 *****
                // 式
                i = c_expression2(switch_exp, switch_stm - 3);
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    if (switch_case_stm[switch_case_no] == switch_default_stm) { continue; }
                    // (caseの式はカンマ区切りなしに変更)
                    // i = c_expression2(switch_case_exp[switch_case_no], switch_case_stm[switch_case_no] - 2);
                    i = c_expression(switch_case_exp[switch_case_no], switch_case_stm[switch_case_no] - 2);
                    code_push("switchgoto", debugpos1, i);
                    code_push('"switch_case_stm' + switch_case_no + '\\' + j + '"', debugpos1, i);
                }
                code_push("pop", debugpos1, i); // 式の値を捨てる
                code_push("goto", debugpos1, i);
                if (switch_default_stm >= 0) {
                    code_push('"switch_default_stm\\' + j + '"', debugpos1, i);
                } else {
                    code_push('"switch_end\\' + j + '"', debugpos1, i);
                }
                // 文
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    code_push("label", debugpos1, i);
                    if (switch_case_stm[switch_case_no] == switch_default_stm) {
                        code_push('"switch_default_stm\\' + j + '"', debugpos1, i);
                    } else {
                        code_push('"switch_case_stm' + switch_case_no + '\\' + j + '"', debugpos1, i);
                    }
                    if (switch_case_no < switch_case_exp.length - 1) {
                        switch_case_stm_end = switch_case_exp[switch_case_no + 1];
                    } else {
                        switch_case_stm_end = switch_end;
                    }
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    i = c_statement(switch_case_stm[switch_case_no], switch_case_stm_end - 1, '"switch_end\\' + j + '"', continue_lbl);
                }
                // 終了
                code_push("label", debugpos1, i);
                code_push('"switch_end\\' + j + '"', debugpos1, i);
                i = switch_end;
                continue;
            }

            // ***** if文のとき *****
            // if (式) { 文 } elsif (式) { 文 } ... elsif (式) { 文 } else { 文 }
            if (tok == "if") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                token_match("(", i++);
                // 式
                if_exp = i;
                k = 1;
                if (token[i] == ")") {
                    debugpos2 = i + 1;
                    throw new Error("if文の条件式がありません。");
                }
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(")", i++);
                token_match("{", i++);
                // 文
                if_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match("}", i++);
                if_stm_end = i;
                // elsifまたはelse
                elsif_exp = [];
                elsif_stm = [];
                elsif_stm_end = [];
                else_stm = -1;
                while (i < tok_end) {
                    // elsif
                    if (token[i] == "elsif") {
                        debugpos1 = i; // エラー表示位置調整
                        i++;
                        token_match("(", i++);
                        // 式
                        elsif_exp.push(i);
                        k = 1;
                        if (token[i] == ")") {
                            debugpos2 = i + 1;
                            throw new Error("elsif文の条件式がありません。");
                        }
                        while (i < tok_end) {
                            if (token[i] == "(") { k++; }
                            if (token[i] == ")") { k--; }
                            if (k == 0) { break; }
                            i++;
                        }
                        token_match(")", i++);
                        token_match("{", i++);
                        // 文
                        elsif_stm.push(i);
                        k = 1;
                        while (i < tok_end) {
                            if (token[i] == "{") { k++; }
                            if (token[i] == "}") { k--; }
                            if (k == 0) { break; }
                            i++;
                        }
                        token_match("}", i++);
                        elsif_stm_end.push(i);
                        continue;
                    }
                    // else
                    if (token[i] == "else") {
                        debugpos1 = i; // エラー表示位置調整
                        i++;
                        token_match("{", i++);
                        // 文
                        else_stm = i;
                        k = 1;
                        while (i < tok_end) {
                            if (token[i] == "{") { k++; }
                            if (token[i] == "}") { k--; }
                            if (k == 0) { break; }
                            i++;
                        }
                        token_match("}", i++);
                        break;
                    }
                    // その他
                    break;
                }
                // 終了
                if_end = i;
                // ***** コードの生成 *****
                debugpos1 = j - 1; // エラー表示位置調整
                // 式
                i = c_expression2(if_exp, if_stm - 3);
                code_push("ifnotgoto", debugpos1, i);
                if (elsif_exp.length > 0) {
                    code_push('"elsif_exp0\\' + j + '"', debugpos1, i);
                } else if (else_stm >= 0) {
                    code_push('"else_stm\\' + j + '"', debugpos1, i);
                } else {
                    code_push('"if_end\\' + j + '"', debugpos1, i);
                }
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                i = c_statement(if_stm, if_stm_end - 1, break_lbl, continue_lbl);
                if (elsif_exp.length > 0 || else_stm >=0) {
                    code_push("goto", debugpos1, i);
                    code_push('"if_end\\' + j + '"', debugpos1, i);
                }
                // elsif
                for (elsif_no = 0; elsif_no < elsif_exp.length; elsif_no++) {
                    // 式
                    code_push("label", debugpos1, i);
                    code_push('"elsif_exp' + elsif_no + '\\' + j + '"', debugpos1, i);
                    i = c_expression2(elsif_exp[elsif_no], elsif_stm[elsif_no] - 3);
                    code_push("ifnotgoto", debugpos1, i);
                    if (elsif_exp.length > elsif_no + 1) {
                        code_push('"elsif_exp' + (elsif_no + 1) + '\\' + j + '"', debugpos1, i);
                    } else if (else_stm >= 0) {
                        code_push('"else_stm\\' + j + '"', debugpos1, i);
                    } else {
                        code_push('"if_end\\' + j + '"', debugpos1, i);
                    }
                    // 文
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    i = c_statement(elsif_stm[elsif_no], elsif_stm_end[elsif_no] - 1, break_lbl, continue_lbl);
                    if (elsif_exp.length > elsif_no + 1 || else_stm >=0) {
                        code_push("goto", debugpos1, i);
                        code_push('"if_end\\' + j + '"', debugpos1, i);
                    }
                }
                // else
                if (else_stm >= 0) {
                    // 文
                    code_push("label", debugpos1, i);
                    code_push('"else_stm\\' + j + '"', debugpos1, i);
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    i = c_statement(else_stm, if_end - 1, break_lbl, continue_lbl);
                }
                // 終了
                code_push("label", debugpos1, i);
                code_push('"if_end\\' + j + '"', debugpos1, i);
                i = if_end;
                continue;
            }

            // ***** for文のとき *****
            // for (式1; 式2; 式3) { 文 }
            if (tok == "for") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                token_match("(", i++);
                // 式1
                for_exp1 = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "?" && sp_compati_flag) { k++; }
                    if (token[i] == ";") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(";", i++);
                // 式2
                for_exp2 = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "?" && sp_compati_flag) { k++; }
                    if (token[i] == ";") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(";", i++);
                // 式3
                for_exp3 = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(")", i++);
                token_match("{", i++);
                // 文
                for_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match("}", i++);
                // 終了
                for_end = i;
                // ***** コードの生成 *****
                // 式1
                if (for_exp1 < for_exp2 - 1) {
                    i = c_expression2(for_exp1, for_exp2 - 2);
                    code_push("pop", debugpos1, i);
                }
                code_push("goto", debugpos1, i);
                code_push('"for_exp2\\' + j + '"', debugpos1, i);
                // 式3
                code_push("label", debugpos1, i);
                code_push('"for_exp3\\' + j + '"', debugpos1, i);
                if (for_exp3 < for_stm - 2) {
                    i = c_expression2(for_exp3, for_stm - 3);
                    code_push("pop", debugpos1, i);
                }
                // 式2 (空なら無限ループ)
                code_push("label", debugpos1, i);
                code_push('"for_exp2\\' + j + '"', debugpos1, i);
                if (for_exp2 < for_exp3 - 1) {
                    i = c_expression2(for_exp2, for_exp3 - 2);
                    code_push("ifnotgoto", debugpos1, i);
                    code_push('"for_end\\' + j + '"', debugpos1, i);
                }
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                i = c_statement(for_stm, for_end - 1, '"for_end\\' + j + '"', '"for_exp3\\' + j + '"');
                code_push("goto", debugpos1, i);
                code_push('"for_exp3\\' + j + '"', debugpos1, i);
                // 終了
                code_push("label", debugpos1, i);
                code_push('"for_end\\' + j + '"', debugpos1, i);
                i = for_end;
                continue;
            }

            // ***** while文のとき *****
            // while (式) { 文 }
            if (tok == "while") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                token_match("(", i++);
                // 式
                while_exp = i;
                k = 1;
                if (token[i] == ")") {
                    debugpos2 = i + 1;
                    throw new Error("while文の条件式がありません。");
                }
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(")", i++);
                token_match("{", i++);
                // 文
                while_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match("}", i++);
                // 終了
                while_end = i;
                // ***** コードの生成 *****
                // 式
                code_push("label", debugpos1, i);
                code_push('"while_exp\\' + j + '"', debugpos1, i);
                i = c_expression2(while_exp, while_stm - 3);
                code_push("ifnotgoto", debugpos1, i);
                code_push('"while_end\\' + j + '"', debugpos1, i);
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                i = c_statement(while_stm, while_end - 1, '"while_end\\' + j + '"', '"while_exp\\' + j + '"');
                code_push("goto", debugpos1, i);
                code_push('"while_exp\\' + j + '"', debugpos1, i);
                // 終了
                code_push("label", debugpos1, i);
                code_push('"while_end\\' + j + '"', debugpos1, i);
                i = while_end;
                continue;
            }

            // ***** do文のとき *****
            // do { 文 } while (式)
            if (tok == "do") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                token_match("{", i++);
                // 文
                do_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match("}", i++);
                if (token[i] != "while") {
                    debugpos2 = i + 1;
                    throw new Error("do文のwhileがありません。");
                }
                i++;
                token_match("(", i++);
                // 式
                do_exp = i;
                k = 1;
                if (token[i] == ")") {
                    debugpos2 = i + 1;
                    throw new Error("do文の条件式がありません。");
                }
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                token_match(")", i++);
                // 終了
                do_end = i;
                // ***** コードの生成 *****
                // 文
                code_push("label", debugpos1, i);
                code_push('"do_stm\\' + j + '"', debugpos1, i);
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                i = c_statement(do_stm, do_exp - 3, '"do_end\\' + j + '"', '"do_stm\\' + j + '"');
                // 式
                i = c_expression2(do_exp, do_end - 2);
                code_push("ifgoto", debugpos1, i);
                code_push('"do_stm\\' + j + '"', debugpos1, i);
                // 終了
                code_push("label", debugpos1, i);
                code_push('"do_end\\' + j + '"', debugpos1, i);
                i = do_end;
                continue;
            }

            // ***** 式のコンパイル *****
            i = c_expression(i, tok_end);
            code_push("pop", debugpos1, i);
        }
        // ***** 戻り値を返す *****
        return i;
    }

    // ***** 式のコンパイル *****
    // (priorityは演算子の優先順位を表す。大きいほど優先順位が高い)
    function c_expression(tok_start, tok_end, priority) {
        var i, j;
        var tok;
        var tri_flag;

        // ***** 引数のチェック *****
        if (priority == null) { priority = 0; }
        // ***** 因子のコンパイル *****
        i = tok_start;
        i = c_factor(i, tok_end);
        // ***** 演算子処理のループ *****
        tri_flag = false;
        while (i < tok_end) {
            // ***** トークンを取り出す *****
            // debugpos1 = i;
            tok = token[i];
            // ***** 「&」のとき *****
            if (tok == "&" && priority < 10) {
                i++;
                i = c_expression(i, tok_end, 10);
                code_push("and", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「&&」のとき *****
            if (tok == "&&" && priority < 10) {
                j = i;
                i++;
                code_push("ifnotgoto", debugpos1, i);
                code_push('"and_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                code_push("ifnotgoto", debugpos1, i);
                code_push('"and_zero\\' + j + '"', debugpos1, i);
                code_push("push1", debugpos1, i);
                code_push("goto", debugpos1, i);
                code_push('"and_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"and_zero\\' + j + '"', debugpos1, i);
                code_push("push0", debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"and_end\\' + j + '"', debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「|」のとき *****
            if (tok == "|" && priority < 10) {
                i++;
                i = c_expression(i, tok_end, 10);
                code_push("or", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「||」のとき *****
            if (tok == "||" && priority < 10) {
                j = i;
                i++;
                code_push("ifgoto", debugpos1, i);
                code_push('"or_one\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                code_push("ifgoto", debugpos1, i);
                code_push('"or_one\\' + j + '"', debugpos1, i);
                code_push("push0", debugpos1, i);
                code_push("goto", debugpos1, i);
                code_push('"or_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"or_one\\' + j + '"', debugpos1, i);
                code_push("push1", debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"or_end\\' + j + '"', debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「^」のとき *****
            if (tok == "^" && priority < 10) {
                i++;
                i = c_expression(i, tok_end, 10);
                code_push("xor", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 3項演算子「?:」のとき *****
            if (tok == "?" && priority < 10) {
                j = i;
                i++;
                code_push("ifnotgoto", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                token_match(":", i++);
                code_push("goto", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                // (互換モードのときのみ末尾のセミコロン(;)が必要(過去との互換性維持のため))
                if (sp_compati_flag) {
                    token_match(";", i++);
                }
                code_push("label", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                tri_flag = true;
                continue;
            }

            // (3項演算子の処理後は、優先順位10の演算子しか処理しない(過去との互換性維持のため))
            if (sp_compati_flag && tri_flag) {
                break;
            }

            // ***** 各種2項演算子のとき *****
            if (tok == "<<" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("shl", debugpos1, i);
                continue;
            }
            if (tok == "<" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmplt", debugpos1, i);
                continue;
            }
            if (tok == "<=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmple", debugpos1, i);
                continue;
            }
            if (tok == ">>>" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("ushr", debugpos1, i);
                continue;
            }
            if (tok == ">>" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("shr", debugpos1, i);
                continue;
            }
            if (tok == ">" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpgt", debugpos1, i);
                continue;
            }
            if (tok == ">=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpge", debugpos1, i);
                continue;
            }
            if (tok == "==" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpeq", debugpos1, i);
                continue;
            }
            if (tok == "!=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpne", debugpos1, i);
                continue;
            }
            if (tok == "+" && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("add", debugpos1, i);
                continue;
            }
            if (tok == "." && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("addstr", debugpos1, i);
                continue;
            }
            if (tok == "-" && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("sub", debugpos1, i);
                continue;
            }
            if (tok == "*" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("mul", debugpos1, i);
                continue;
            }
            if (tok == "/" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                if (sp_compati_flag) {
                    code_push("divint", debugpos1, i);
                } else {
                    code_push("div", debugpos1, i);
                }
                continue;
            }
            if (tok == "\\" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("divint", debugpos1, i);
                continue;
            }
            if (tok == "%" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("mod", debugpos1, i);
                continue;
            }
            // ***** 演算子処理のループを抜ける *****
            break;
        }
        // ***** 戻り値を返す *****
        return i;
    }

    // ***** 式のコンパイル2(カンマ区切りありバージョン) *****
    function c_expression2(tok_start, tok_end) {
        var i;

        // ***** 式のコンパイル *****
        i = tok_start;
        i = c_expression(i, tok_end);
        // ***** カンマ区切りの処理 *****
        while (i < tok_end) {
            if (token[i] == ",") {
                i++;
                code_push("pop", debugpos1, i);
                i = c_expression(i, tok_end);
                continue;
            }
            break;
        }
        // ***** 戻り値を返す *****
        return i;
    }

    // ***** 因子のコンパイル *****
    function c_factor(tok_start, tok_end) {
        var num;
        var i;
        var ch;
        var tok;
        var func_type;
        var func_name;
        var param_num;

        // ***** トークンを取り出す *****
        i = tok_start;
        // debugpos1 = i;
        tok = token[i];
        // ***** 各種単項演算子のとき *****
        if (tok == "!") {
            i++;
            i = c_factor(i, tok_end);
            code_push("lognot", debugpos1, i);
            return i;
        }
        if (tok == "~") {
            i++;
            i = c_factor(i, tok_end);
            code_push("not", debugpos1, i);
            return i;
        }
        if (tok == "+") {
            i++;
            i = c_factor(i, tok_end);
            code_push("positive", debugpos1, i);
            return i;
        }
        if (tok == "-") {
            i++;
            i = c_factor(i, tok_end);
            code_push("negative", debugpos1, i);
            return i;
        }
        // ***** 括弧のとき *****
        if (tok == "(") {
            i++;
            i = c_expression2(i, tok_end);
            token_match(")", i++);
            return i;
        }
        // ***** アドレス的なもののとき *****
        // ***** (変数名を取得して返す) *****
        if (tok == "&") {
            i++;
            if (token[i] == "(") {
                i++;
                i = c_varname(i, tok_end);
                token_match(")", i++);
            } else {
                i = c_varname(i, tok_end);
            }
            return i;
        }
        // ***** プレインクリメント/デクリメントのとき *****
        if (tok == "++") {
            i++;
            i = c_varname(i, tok_end);
            code_push("preinc", debugpos1, i);
            return i;
        }
        if (tok == "--") {
            i++;
            i = c_varname(i, tok_end);
            code_push("predec", debugpos1, i);
            return i;
        }

        // ***** 組み込み関数/組み込み変数のとき *****
        if (func_tbl.hasOwnProperty(tok)) { func_type = 1; }
        else if (addfunc_tbl.hasOwnProperty(tok)) { func_type = 2; }
        else { func_type = 0; }
        if (func_type > 0) {
            i++;
            func_name = tok;
            code_push("push", debugpos1, i);
            // code_push('"' + func_name + '"', debugpos1, i);
            code_push('"' + func_name + '"', debugpos1, i, func_type);
            // ***** 組み込み変数のとき *****
            if (func_type == 1 && func_tbl[func_name].param_num == -1) {
                code_push("callfunc", debugpos1, i);
                code_push(0, debugpos1, i);
                return i;
            }
            if (func_type == 2 && addfunc_tbl[func_name].param_num == -1) {
                code_push("callfunc2", debugpos1, i);
                code_push(0, debugpos1, i);
                return i;
            }
            // ***** funcgotoは式の中では使用不可 *****
            if (func_name == "funcgoto") {
                debugpos2 = i;
                throw new Error("funcgoto は式の中では使用できません。");
            }
            // ***** 組み込み関数のとき *****
            token_match("(", i++);
            // ***** 引数の取得 *****
            param_num = 0;
            if (token[i] == ")") {
                i++;
            } else {
                while (i < tok_end) {
                    // ***** 「変数名をとる引数」のとき *****
                    if ((func_type == 1 && func_tbl[func_name].param_varname_flag.hasOwnProperty(param_num)) ||
                        (func_type == 2 && addfunc_tbl[func_name].param_varname_flag.hasOwnProperty(param_num))) {
                        i = c_varname(i, tok_end);
                    } else {
                        i = c_expression(i, tok_end);
                    }
                    param_num++;
                    if (token[i] == ",") {
                        i++;
                        continue;
                    }
                    break;
                }
                token_match(")", i++);
            }
            if ((func_type == 1 && param_num < func_tbl[func_name].param_num) ||
                (func_type == 2 && param_num < addfunc_tbl[func_name].param_num)) {
                debugpos2 = i;
                throw new Error(func_name + " の引数の数が足りません。");
            }
            // ***** 関数の呼び出し *****
            if (func_type == 1) {
                if (func_name == "input" || func_name == "keyinput") {
                    code_push("callwait", debugpos1, i);
                } else {
                    code_push("callfunc", debugpos1, i);
                }
            } else {
                code_push("callfunc2", debugpos1, i);
            }
            // ***** 引数の数を設定 *****
            code_push(param_num, debugpos1, i);
            // ***** 戻り値を返す *****
            return i;
        }

        // ***** 1文字取り出す *****
        ch = tok.charAt(0);
        // ***** 文字列のとき *****
        if (ch == '"') {
            i++;
            num = tok;
            code_push("push", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** 数値のとき *****
        // (符号ありの数値を許可(定数展開の関係で特別扱い))
        if (isDigit1(ch) || (isSign1(ch) && isDigit1(tok.charAt(1)))) {
            i++;
            num = +tok; // 数値にする
            code_push("push", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** アルファベットかアンダースコアかポインタのとき *****
        if (isAlpha1(ch) || ch == "_" || ch == "*") {

            // ***** 変数名のコンパイル *****
            i = c_varname(i, tok_end);

            // ***** 関数のとき *****
            if (token[i] == "(") {
                i++;
                // ***** 引数の取得 *****
                param_num = 0;
                if (token[i] == ")") {
                    i++;
                } else {
                    while (i < tok_end) {
                        i = c_expression(i, tok_end);
                        param_num++;
                        if (token[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    token_match(")", i++);
                }
                // ***** 関数の呼び出し *****
                code_push("calluser", debugpos1, i);
                // ***** 引数の数を設定 *****
                code_push(param_num, debugpos1, i);
                // ***** 戻り値を返す *****
                return i;
            }

            // ***** 変数の処理 *****

            // ***** トークンを取り出す *****
            tok = token[i];
            // ***** ポストインクリメント/デクリメントのとき *****
            if (tok == "++") {
                i++;
                code_push("postinc", debugpos1, i);
                return i;
            }
            if (tok == "--") {
                i++;
                code_push("postdec", debugpos1, i);
                return i;
            }
            // ***** 代入のとき *****
            if (tok == "=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("load", debugpos1, i);
                return i;
            }
            // ***** 複合代入のとき *****
            if (tok == "+="   || tok == "-="   || tok == "*="   || tok == "/="   ||
                tok == "\\="  || tok == "%="   || tok == ".="   ||
                tok == "&="   || tok == "|="   || tok == "^="   ||
                tok == "<<="  || tok == ">>>=" || tok == ">>=") {
                i++;
                code_push("dup", debugpos1, i);
                code_push("store", debugpos1, i);
                i = c_expression(i, tok_end);
                if (tok == "+=") {
                    code_push("add", debugpos1, i);
                }
                if (tok == "-=") {
                    code_push("sub", debugpos1, i);
                }
                if (tok == "*=") {
                    code_push("mul", debugpos1, i);
                }
                if (tok == "/=") {
                    if (sp_compati_flag) {
                        code_push("divint", debugpos1, i);
                    } else {
                        code_push("div", debugpos1, i);
                    }
                }
                if (tok == "\\=") {
                    code_push("divint", debugpos1, i);
                }
                if (tok == "%=") {
                    code_push("mod", debugpos1, i);
                }
                if (tok == ".=") {
                    code_push("addstr", debugpos1, i);
                }
                if (tok == "&=") {
                    code_push("and", debugpos1, i);
                }
                if (tok == "|=") {
                    code_push("or", debugpos1, i);
                }
                if (tok == "^=") {
                    code_push("xor", debugpos1, i);
                }
                if (tok == "<<=") {
                    code_push("shl", debugpos1, i);
                }
                if (tok == ">>>=") {
                    code_push("ushr", debugpos1, i);
                }
                if (tok == ">>=") {
                    code_push("shr", debugpos1, i);
                }
                code_push("load", debugpos1, i);
                return i;
            }

            // ***** 変数の値を返す *****
            code_push("store", debugpos1, i);
            return i;
        }
        // ***** 構文エラー *****
        // (一部の構文エラーを発生させない(過去との互換性維持のため))
        if (sp_compati_flag && tok == ")") {
            i++;
            code_push("push0", debugpos1, i);
            return i;
        }
        debugpos2 = i + 1;
        throw new Error("構文エラー 予期しない '" + token[i] + "' が見つかりました。");
        // ***** 戻り値を返す *****
        // i++;
        // return i;
    }

    // ***** 変数名のコンパイル(通常用) *****
    function c_varname(tok_start, tok_end) {
        var i;
        var var_name;
        var loc_flag;

        // ***** 変数名取得 *****
        i = tok_start;
        // debugpos1 = i;
        var_name = token[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (変数の内容を変数名にする) *****
        if (var_name == "*") {
            if (token[i] == "(") {
                i++;
                i = c_varname(i, tok_end);
                token_match(")", i++);
            } else {
                i = c_varname(i, tok_end);
            }
            code_push("pointer", debugpos1, i);
            // ***** 配列変数のとき *****
            while (token[i] == "[") {
                i++;
                // i = Math.trunc(c_expression(i, tok_end));
                i = c_expression(i, tok_end); // 配列の添字に文字列もあり
                token_match("]", i++);
                code_push("array", debugpos1, i);
            }
            return i;
        }
        // ***** グローバル/ローカル変数の指定のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            loc_flag = (var_name.charAt(0) == "l");
            var_name = token[i++];
            checkvarname(var_name, i);
            if (use_local_vars && loc_flag) {
                var_name = "l\\" + var_name;
            }
        } else {
            checkvarname(var_name, i);
            // ***** ローカル文フラグのチェック *****
            // ***** ローカル変数名情報のチェック *****
            if (use_local_vars &&
                (locstatement_flag ||
                 (locvarnames_stack.length > 0 &&
                  hasOwn.call(locvarnames_stack[locvarnames_stack.length - 1], var_name)))) {
                var_name = "l\\" + var_name;
                // ***** ローカル文フラグOFF *****
                if (locstatement_flag) { locstatement_flag = false; }
            }
        }
        // ***** ローカル変数名情報の更新 *****
        if (use_local_vars &&
            locvarnames_stack.length > 0 && var_name.substring(0, 2) == "l\\" &&
            !hasOwn.call(locvarnames_stack[locvarnames_stack.length - 1], var_name.substring(2))) {
            locvarnames_stack[locvarnames_stack.length - 1][var_name.substring(2)] = true;
        }
        // ***** 変数名を設定 *****
        code_push("push", debugpos1, i);
        // code_push('"' + var_name + '"', debugpos1, i);
        code_push('"' + var_name + '"', debugpos1, i, 10);
        // ***** 配列変数のとき *****
        while (token[i] == "[") {
            i++;
            // i = Math.trunc(c_expression(i, tok_end));
            i = c_expression(i, tok_end); // 配列の添字に文字列もあり
            token_match("]", i++);
            code_push("array", debugpos1, i);
        }
        // ***** 戻り値を返す *****
        return i;
    }

    // ***** 変数名のコンパイル2(関数の仮引数用) *****
    function c_varname2(tok_start, tok_end, pointer_flag) {
        var i;
        var var_name;
        var loc_flag;

        // ***** 引数のチェック *****
        if (pointer_flag == null) { pointer_flag = false; }

        // ***** 変数名取得 *****
        i = tok_start;
        // debugpos1 = i;
        var_name = token[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (*を削り、ポインタフラグをONにする) *****
        if (var_name == "*") {
            if (token[i] == "(") {
                i++;
                i = c_varname2(i, tok_end, true);
                token_match(")", i++);
            } else {
                i = c_varname2(i, tok_end, true);
            }
            return i;
        }
        // ***** グローバル/ローカル変数の指定のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            loc_flag = (var_name.charAt(0) == "l");
            var_name = token[i++];
            checkvarname(var_name, i);
            if (use_local_vars && loc_flag) {
                var_name = "l\\" + var_name;
            }
        } else {
            checkvarname(var_name, i);
            // (関数の仮引数はデフォルトでローカル変数とする)
            if (use_local_vars) {
                var_name = "l\\" + var_name;
            }
        }
        // ***** ローカル変数名情報の更新 *****
        if (use_local_vars &&
            locvarnames_stack.length > 0 && var_name.substring(0, 2) == "l\\" &&
            !hasOwn.call(locvarnames_stack[locvarnames_stack.length - 1], var_name.substring(2))) {
            locvarnames_stack[locvarnames_stack.length - 1][var_name.substring(2)] = true;
        }
        // ***** ポインタ的なもののとき *****
        // (関数の仮引数に「p\」を結合して、ローカル変数のスコープを
        //  さかのぼれるようにする)
        if (use_local_vars && pointer_flag && var_name.substring(0, 2) != "p\\") {
            var_name = "p\\" + var_name;
        }
        // ***** 変数名を設定 *****
        code_push("push", debugpos1, i);
        // code_push('"' + var_name + '"', debugpos1, i);
        code_push('"' + var_name + '"', debugpos1, i, 10);
        // ***** 配列変数のとき *****
        while (token[i] == "[") {
            i++;
            // i = Math.trunc(c_expression(i, tok_end));
            i = c_expression(i, tok_end); // 配列の添字に文字列もあり
            token_match("]", i++);
            code_push("array", debugpos1, i);
        }
        // ***** 戻り値を返す *****
        return i;
    }

    // ***** 変数名のチェック *****
    function checkvarname(var_name, tok_start) {
        var i;
        var ch;

        // ***** 変数名のチェック *****
        i = tok_start;
        ch = var_name.charAt(0);
        if (!(isAlpha1(ch) || ch == "_")) {
            debugpos2 = i;
            throw new Error("変数名が不正です。('" + var_name + "')");
        }
        if (reserved.hasOwnProperty(var_name) ||
            func_tbl.hasOwnProperty(var_name) ||
            addfunc_tbl.hasOwnProperty(var_name)) {
            debugpos2 = i;
            throw new Error("名前 '" + var_name + "' は予約されているため、変数名には使用できません。");
        }
    }

    // ***** ラベル名のコンパイル *****
    // (ラベル名には数値のみのものも許可する(過去との互換性維持のため))
    // (ラベル名にはダブルクォート付きも許可する(過去との互換性維持のため))
    function c_labelname(tok_start) {
        var i;
        var ch;
        var lbl_name;

        // ***** ラベル名の取得 *****
        i = tok_start;
        // (符号のトークンを許可(特別扱い))
        // lbl_name = token[i++];
        if (isSign1(token[i]) && isDigit1(token[i + 1])) {
            lbl_name = token[i] + token[i + 1];
            i += 2;
        } else {
            lbl_name = token[i++];
        }
        // (ダブルクォート付きも許可(ここでダブルクォートを外す))
        if (lbl_name.charAt(0) == '"') {
            lbl_name = lbl_name.substring(1, lbl_name.length - 1);
        }
        // ***** ラベル名のチェック *****
        // (符号ありの数値を許可(特別扱い))
        ch = lbl_name.charAt(0);
        if (!(isAlpha1(ch) || ch == "_" ||
              isDigit1(ch) || (isSign1(ch) && isDigit1(lbl_name.charAt(1))))) {
            debugpos2 = i;
            throw new Error("ラベル名が不正です。('" + lbl_name + "')");
        }
        if (reserved.hasOwnProperty(lbl_name) ||
            func_tbl.hasOwnProperty(lbl_name) ||
            addfunc_tbl.hasOwnProperty(lbl_name)) {
            debugpos2 = i;
            throw new Error("名前 '" + lbl_name + "' は予約されているため、ラベル名には使用できません。");
        }
        // ***** ラベル名を設定 *****
        code_push('"' + lbl_name + '"', debugpos1, i);
        // ***** 戻り値を返す *****
        return i;
    }

    // ****************************************
    //             プリプロセス処理
    // ****************************************
    // (互換モードの設定や定数の置き換え等を行う)

    // ***** プリプロセス *****
    function preprocess() {
        var i;
        var ch;
        var tok;
        var sp_val_st;
        var sp_value;
        var cst_name;
        var cst_value;

        // ***** 互換モードフラグの初期化 *****
        sp_compati_flag = false;
        // ***** ローカル変数使用有無の初期化 *****
        use_local_vars = true;
        // ***** 定数の定義情報の生成 *****
        make_const_tbl();
        // ***** トークン解析のループ *****
        i = 0;
        while (i < token_len - end_token_num) { // 終端のトークンは対象外
            // ***** トークンを取り出す *****
            debugpos1 = i;
            tok = token[i];

            // ***** spmode文のとき *****
            if (tok == "spmode") {
                i++;
                token_match("(", i++);
                // ***** 定数の置換 *****
                replace_const(token[i], i);
                // ***** 値の取得 *****
                // (符号のトークンを許可(特別扱い))
                if (isSign1(token[i]) && isDigit1(token[i + 1])) {
                    sp_val_st = token[i] + token[i + 1];
                    i += 2;
                } else {
                    sp_val_st = token[i++];
                }
                // ***** 値のチェック *****
                // (符号ありの数値を許可(定数展開の関係で特別扱い))
                ch = sp_val_st.charAt(0);
                if (!(isDigit1(ch) || (isSign1(ch) && isDigit1(sp_val_st.charAt(1))))) {
                    debugpos2 = i + 1;
                    throw new Error("spmode の引数には数値以外を指定できません。");
                }
                sp_value = +sp_val_st; // 数値にする
                // ***** 互換モードの設定 *****
                if (sp_value == 1) {
                    sp_compati_flag = true;
                    use_local_vars = false;
                    font_size = font_size_set[0];
                } else {
                    sp_compati_flag = false;
                    use_local_vars = true;
                    font_size = font_size_set[1];
                }
                ctx.font = font_size + "px " + font_family;
                token_match(")", i++);
                continue;
            }

            // ***** onlocal/offlocal文のとき *****
            if (tok == "onlocal" || tok == "offlocal") {
                i++;
                token_match("(", i++);
                token_match(")", i++);
                // ***** ローカル変数使用有無の設定 *****
                use_local_vars = (tok == "onlocal");
                continue;
            }

            // ***** defconst文のとき *****
            if (tok == "defconst") {
                i++;
                token_match("(", i++);
                // ***** 定数名の取得 *****
                cst_name = token[i++];
                // ***** 定数名のチェック *****
                ch = cst_name.charAt(0);
                if (!(isAlpha1(ch) || ch == "_")) {
                    debugpos2 = i;
                    throw new Error("定数名が不正です。('" + cst_name + "')");
                }
                token_match(",", i++);
                // ***** 定数の置換 *****
                replace_const(token[i], i);
                // ***** 値の取得 *****
                // (符号のトークンを許可(特別扱い))
                // cst_value = token[i++];
                if (isSign1(token[i]) && isDigit1(token[i + 1])) {
                    cst_value = token[i] + token[i + 1];
                    i += 2;
                } else {
                    cst_value = token[i++];
                }
                // ***** 定数の定義情報1個の生成 *****
                const_tbl[cst_name] = cst_value;
                token_match(")", i++);
                continue;
            }

            // ***** disconst文のとき *****
            if (tok == "disconst") {
                i++;
                token_match("(", i++);
                // ***** 定数名の取得 *****
                cst_name = token[i++];
                // ***** 定数名のチェック *****
                ch = cst_name.charAt(0);
                if (!(isAlpha1(ch) || ch == "_")) {
                    debugpos2 = i;
                    throw new Error("定数名が不正です。('" + cst_name + "')");
                }
                // ***** 定数の定義情報1個の削除 *****
                delete const_tbl[cst_name];
                token_match(")", i++);
                continue;
            }

            // ***** 定数の置換 *****
            replace_const(tok, i);
            i++;
        }
    }

    // ***** 定数の置換 *****
    function replace_const(tok, i) {
        // if (const_tbl.hasOwnProperty(tok)) {
        if (hasOwn.call(const_tbl, tok)) {
            token[i] = const_tbl[tok];
        }
    }

    // ***** 定数の定義情報の生成 *****
    function make_const_tbl() {
        var cst_name;

        const_tbl = {};
        for (cst_name in constants) {
            // if (constants.hasOwnProperty(cst_name)) {
            if (hasOwn.call(constants, cst_name)) {
                const_tbl[cst_name] = String(constants[cst_name]);
            }
        }
    }

    // ****************************************
    //             トークン分割処理
    // ****************************************
    // (ソースの文字列を解析してトークンに分割する)

    // ***** トークン分割 *****
    function tokenize() {
        var i, i2;
        var src_len;
        var ch, ch2, ch3, ch4;
        var tok_start;
        var hex_flag;
        var digit_mode;
        var temp_st;
        var temp_no;
        var line_no;
        var line_no_s;

        // ***** ソース解析のループ *****
        i = 0;
        line_no = 1;
        token = [];
        token_line = [];
        token_len = 0;
        src_len = src.length;
        while (i < src_len) {
            // ***** 1文字取り出す *****
            ch = src.charAt(i++);
            ch2 = src.charAt(i);

            // ***** 空白かTABのとき *****
            if (ch == " " || ch == "\t") { continue; }
            // ***** 改行のとき *****
            if (ch == "\r" || ch == "\n") {
                line_no++;
                if (ch == "\r" && ch2 == "\n") { i++; }
                continue;
            }
            // ***** コメント「//」のとき *****
            if (ch == "/" && ch2 == "/") {
                i++;
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    // ***** 改行のとき *****
                    if (ch == "\r" || ch == "\n") {
                        line_no++;
                        if (ch == "\r" && ch2 == "\n") { i++; }
                        break;
                    }
                }
                continue;
            }
            // ***** コメント「'」のとき *****
            if (ch == "'") {
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    // ***** デリミタのとき *****
                    if (ch == "'") { break; }
                    // ***** 改行のとき *****
                    if (ch == "\r" || ch == "\n") {
                        line_no++;
                        if (ch == "\r" && ch2 == "\n") { i++; }
                    }
                }
                continue;
            }

            // ***** 有効文字のとき *****
            tok_start = i - 1;
            line_no_s = line_no;
            // ***** 16進数のとき *****
            if (ch == "0" && (ch2 == "x" || ch2 == "X")) {
                i++;
                hex_flag = false;
                while (i < src_len) {
                    // ***** 1文字取り出す(iの加算なし) *****
                    ch = src.charAt(i);
                    // ***** 16進数チェック *****
                    if (isHex1(ch)) { i++; hex_flag = true; } else { break; }
                }
                if (!hex_flag) {
                    // (数値の0および後続の変数名と判断)
                    token_push("0", line_no_s);
                    i--;
                    continue;
                }
                temp_st = src.substring(tok_start, i);
                temp_no = +temp_st; // 数値にする
                token_push(String(temp_no), line_no_s);
                continue;
            }
            // ***** 10進数のとき *****
            if (isDigit1(ch)) {
                digit_mode = 1;
                while (i < src_len) {
                    // ***** 1文字取り出す(iの加算なし) *****
                    ch = src.charAt(i);
                    ch2 = src.charAt(i + 1);
                    // ***** 小数点チェック *****
                    if (ch == ".") {
                        if (digit_mode == 1 && isDigit1(ch2)) {
                            i++;
                            digit_mode = 2;
                            continue;
                        }
                        // (後続の文字列連結演算子と判断)
                        break;
                    }
                    // ***** 指数表記チェック *****
                    if (ch == "e" || ch == "E") {
                        i++;
                        // ***** 1文字取り出す(iの加算なし) *****
                        ch = src.charAt(i);
                        ch2 = src.charAt(i + 1);
                        // ***** 指数チェック *****
                        // (符号ありの数値を許可)
                        if (digit_mode <= 2 && (isDigit1(ch) || (isSign1(ch) && isDigit1(ch2)))) {
                            i++;
                            digit_mode = 3;
                            continue;
                        }
                        // (後続の変数名と判断)
                        i--;
                        break;
                    }
                    // ***** 数値チェック *****
                    if (isDigit1(ch)) { i++; } else { break; }
                }
                token_push(src.substring(tok_start, i), line_no_s);
                continue;
            }
            // ***** アルファベットかアンダースコアのとき(名前) *****
            if (isAlpha1(ch) || ch == "_") {
                while (i < src_len) {
                    // ***** 1文字取り出す(iの加算なし) *****
                    ch = src.charAt(i);
                    ch2 = src.charAt(i + 1);
                    // ***** 「::」のチェック *****
                    if (ch == ":" && ch2 == ":") { i += 2; continue; }
                    // ***** アルファベットかアンダースコアか数字のチェック *****
                    if (isAlpha1(ch) || ch == "_" || isDigit1(ch)) { i++; } else { break; }
                }
                token_push(src.substring(tok_start, i), line_no_s);
                continue;
            }
            // ***** 文字列のとき *****
            if (ch == '"') {
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    ch2 = src.charAt(i);
                    // ***** エスケープのとき *****
                    if (ch == "\\") {
                        if (ch2 == "\\" || ch2 == '"') {
                            i++;
                            continue;
                        } else {
                            token_push('"', line_no_s);
                            throw new Error("文字列のエスケープエラー");
                        }
                    }
                    // ***** デリミタのとき *****
                    if (ch == '"') { break; }
                    // ***** 改行のとき *****
                    if (ch == "\r" || ch == "\n") {
                        line_no++;
                        if (ch == "\r" && ch2 == "\n") { i++; }
                    }
                }
                temp_st = src.substring(tok_start, i);
                // ***** デリミタがなければ追加する *****
                if (temp_st.length == 1 || ch != '"') { temp_st += '"'; }
                // ***** エスケープ処理 *****
                temp_st = temp_st
                    .replace(/\\"/g,  '"')   // 「"」のエスケープ
                    .replace(/\\\\/g, "\\"); // 「\」のエスケープ ← これは最後にしないといけない
                token_push(temp_st, line_no_s);
                continue;
            }
            // ***** 演算子その他のとき *****
            if (ch == "+" || ch == "-"  || ch == "&" || ch == "|") {
                if (ch2 == ch)  { i++; }
                if (ch2 == "=") { i++; }
            }
            if (ch == "=" || ch == "!"  || ch == "*" || ch == "/" ||
                ch == "%" || ch == "\\" || ch == "." || ch == "^") {
                if (ch2 == "=") { i++; }
            }
            if (ch == "<") {
                if (ch2 == "=") { i++; }
                if (ch2 == "<") {
                    i++;
                    ch3 = src.charAt(i);
                    if (ch3 == "=") { i++; }
                }
            }
            if (ch == ">") {
                if (ch2 == "=") { i++; }
                if (ch2 == ">") {
                    i++;
                    ch3 = src.charAt(i);
                    if (ch3 == "=") { i++; }
                    if (ch3 == ">") {
                        i++;
                        ch4 = src.charAt(i);
                        if (ch4 == "=") { i++; }
                    }
                }
            }
            token_push(src.substring(tok_start, i), line_no_s);
        }
        // ***** 終端のトークンを追加(安全のため) *****
        for (i2 = 0; i2 < end_token_num; i2++) {
            token_push("end", line_no);
        }
    }

    // ****************************************
    //                補助関数等
    // ****************************************

    // ***** 正負と小数と指数も含めた数値チェック(-1.23e4等) *****
    function isFullDigit(num_st) {
        if (num_st.match(/^\s*[+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\s*$/)) { return true; }
        return false;
    }
    // ***** 数値チェック(1文字のみ) *****
    function isDigit1(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 0x30 && c <= 0x39) { return true; }
        return false;
    }
    // ***** アルファベットチェック(1文字のみ) *****
    function isAlpha1(ch) {
        var c = ch.charCodeAt(0);
        if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) { return true; }
        return false;
    }
    // ***** 16進数チェック(1文字のみ) *****
    function isHex1(ch) {
        var c = ch.charCodeAt(0);
        if ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66)) { return true; }
        return false;
    }
    // ***** 符号チェック(1文字のみ) *****
    function isSign1(ch) {
        if (ch == "+" || ch == "-") { return true; }
        return false;
    }

    // ***** トークン追加 *****
    function token_push(tok, line_no) {
        token[token_len] = tok;
        token_line[token_len++] = line_no;
    }

    // ***** トークンの一致チェック *****
    function token_match(tok, i) {
        if (i >= token_len) {
            debugpos2 = token_len;
            throw new Error("'" + tok + "' が見つかりませんでした。");
        }
        if (tok != token[i]) {
            debugpos2 = i + 1;
            throw new Error("'" + tok + "' があるべき所に '" + token[i] + "' が見つかりました。");
        }
        // ***** 加算されないので注意 *****
        // i++;
    }

    // ***** コード追加 *****
    function code_push(tok, pos1, pos2, code_kind) {
        var i;
        var var_kind;
        var var_name;
        var func_name;

        // ***** コードの追加 *****
        if (code_kind == 1) {
            // (組み込み関数名のときは、関数の実体を格納)
            func_name = tok.substring(1, tok.length - 1); // ダブルクォートを外す
            code[code_len] = func_tbl[func_name].func;
        } else if (code_kind == 2) {
            // (追加の組み込み関数名のときは、関数の実体を格納)
            func_name = tok.substring(1, tok.length - 1); // ダブルクォートを外す
            code[code_len] = addfunc_tbl[func_name].func;
        } else if (code_kind == 10) {
            // (変数名のときは、変数オブジェクトを格納)
            i = 0;
            var_kind = 0;
            var_name = tok.substring(1, tok.length - 1);  // ダブルクォートを外す
            // ***** 接頭語のチェック *****
            if (var_name.substring(0, 2) == "p\\") {
                i = 2;
                // (関数の仮引数かつポインタ)
                var_kind |= 8;
            }
            if (var_name.substring(i, i + 2) == "l\\") {
                i += 2;
                // (ローカル変数)
                var_kind |= 1;
            }
            // ***** 変数オブジェクトを1個生成する *****
            code[code_len] = make_var_obj(var_kind, var_name.substring(i), 0);
        } else if (opcode.hasOwnProperty(tok)) {
            // (命令コードのときは、数値に変換して格納)
            code[code_len] = opcode[tok];
        } else if (tok.charAt && tok.charAt(0) == '"') {
            // (文字列のときは、ダブルクォートを外して格納)
            code[code_len] = tok.substring(1, tok.length - 1);
        } else {
            // (その他のときは、そのまま格納)
            code[code_len] = tok;
        }
        // ***** コード情報の追加 *****
        // (デバッグ位置の情報を格納)
        code_info[code_len] = {};
        code_info[code_len].pos1 = pos1;
        code_info[code_len].pos2 = pos2;
        // ***** コード文字列の追加 *****
        // (そのまま格納)
        code_str[code_len++] = tok;
    }

    // ***** エラー場所の表示 *****
    function show_err_place(debugpos1, debugpos2) {
        var i;
        var msg;

        msg = "エラー場所: " + token_line[debugpos1] + "行: ";
        if (debugpos2 <= debugpos1) { debugpos2 = debugpos1 + 1; } // エラーが出ない件の対策
        for (i = debugpos1; i < debugpos2; i++) {
            if (i >= 0 && i < token_len) {
                msg += token[i] + " ";
            }
        }
        if (debugpos2 >= token_len) { msg += "- プログラム最後まで検索したが文が完成せず。"; }
        DebugShow(msg + "\n");
    }

    // ***** 変数オブジェクトを1個生成する *****
    // (変数オブジェクトは、グローバル/ローカル変数にアクセスするために使用する。
    //  変数オブジェクトは、基本的に参照専用であり 生成後に変更してはいけない。
    //  変更が必要な場合には、duplicate_var_obj(var_obj) を使用して 複製したものを変更する)
    function make_var_obj(kind, name, scope) {
        var var_obj = {};
        var_obj.kind = kind;   // 変数の種別(=0:グローバル変数,=1:ローカル変数,
                               //            =2:関数の引数かつポインタ,
                               //            =8:関数の仮引数かつポインタ)
        var_obj.name = name;   // 変数名
        var_obj.scope = scope; // 変数が所属するスコープの番号
                               // (これは、変数の種別が「関数の引数かつポインタ」のときのみ有効)
        return var_obj;
    }
    // ***** 変数オブジェクトを1個複製する *****
    function duplicate_var_obj(var_obj) {
        var var_obj2 = {};
        var_obj2.kind = var_obj.kind;
        var_obj2.name = var_obj.name;
        var_obj2.scope = var_obj.scope;
        return var_obj2;
    }
    // ***** 変数オブジェクトの取得 *****
    function get_var_obj(var_obj) {
        // ***** NOP *****
        return var_obj;
    }
    // ***** グローバル変数化 *****
    // (画像変数名や関数名に変換するときに使用)
    function to_global(var_obj) {
        return var_obj.name;
    }

    // ***** 変数用クラス(staticクラス) *****
    // (グローバル/ローカル変数の内容を保持するクラス)
    // (使用前に Vars.init() で初期化が必要)
    var Vars = (function () {
        // ***** コンストラクタ *****
        // ***** (staticクラスのため未使用) *****
        function Vars() { }

        // ***** 内部変数 *****
        var vars_stack = []; // グローバル/ローカル変数のスコープ(配列)
                             //   (変数の内容はここに格納される)
                             //   (配列の0はグローバル変数用)
                             //   (配列の1以降はローカル変数用)
        var local_scope_num; // ローカル変数のスコープ数

        // ***** 変数のタイプチェック(内部処理用) *****
        // (戻り値は、グローバル/ローカル変数のスコープの番号を返す)
        function checkType(var_obj) {
            var var_kind;
            var scope_no;

            var_kind = var_obj.kind;
            if (var_kind & 2) {
                // (関数の引数かつポインタ)
                scope_no = var_obj.scope;
                if (!(scope_no >= 1 && scope_no <= local_scope_num)) {
                    throw new Error("ポインタの指す先が不正です(スコープエラー)。");
                }
                return scope_no;
            }
            if (var_kind & 1) {
                // (ローカル変数)
                // if (!(local_scope_num > 0)) {
                //     throw new Error("変数のスコープエラー。");
                // }
                return local_scope_num;
            }
            // (グローバル変数)
            return 0;
        }
        // ***** 配列変数の一括操作(内部処理用) *****
        var controlArray = (function () {
            var f;

            if (Object.keys && Array.prototype.filter && Array.prototype.forEach) {
                f = function (now_vars, var_name, var_name_len, func) {
                    Object.keys(now_vars).filter(function (v) {
                        return (v.substring(0, var_name_len) == var_name);
                    }).forEach(func);
                };
            } else {
                f = function (now_vars, var_name, var_name_len, func) {
                    var v;
                    for (v in now_vars) {
                        if (v.substring(0, var_name_len) == var_name) {
                            // (ここでは安全のため hasOwn のままにしておく)
                            // if (now_vars.hasOwnProperty(v)) {
                            if (hasOwn.call(now_vars, v)) {
                            // if (now_vars[v] != null) {
                                func(v);
                            }
                        }
                    }
                };
            }
            return f;
        })();

        // ***** 変数初期化(staticメソッド) *****
        Vars.init = function () {
            vars_stack = [];     // グローバル/ローカル変数のスコープ(配列)の初期化
            // vars_stack[0] = {};  // グローバル変数のスコープの初期化
            vars_stack[0] = hashInit(); // グローバル変数のスコープの初期化
            local_scope_num = 0; // ローカル変数のスコープ数の初期化
        };
        // ***** グローバル変数を取得する(staticメソッド)(デバッグ用) *****
        Vars.getGlobalVars = function () {
            return vars_stack[0];
        };
        // ***** ローカル変数を取得する(staticメソッド)(デバッグ用) *****
        Vars.getLocalVars = function () {
            if (local_scope_num > 0) {
                return vars_stack[local_scope_num];
            }
            return {};
        };
        // ***** ローカル変数のスコープを1個生成する(staticメソッド) *****
        Vars.makeLocalScope = function () {
            local_scope_num++;
            // vars_stack[local_scope_num] = {};
            vars_stack[local_scope_num] = hashInit();
        };
        // ***** ローカル変数のスコープを1個削除する(staticメソッド) *****
        Vars.deleteLocalScope = function () {
            if (local_scope_num > 0) {
                vars_stack.pop();
                local_scope_num--;
            }
        };
        // ***** ローカル変数のスコープの保存数を取得する(staticメソッド) *****
        Vars.getLocalScopeNum = function () {
            return local_scope_num;
        };
        // ***** 全変数を削除する(staticメソッド) *****
        Vars.clearVars = function () {
            var i;
            for (i = 0; i <= local_scope_num; i++) {
                // vars_stack[i] = {};
                vars_stack[i] = hashInit();
            }
        };
        // ***** ローカル変数を削除する(staticメソッド) *****
        Vars.clearLocalVars = function () {
            if (local_scope_num > 0) {
                // vars_stack[local_scope_num] = {};
                vars_stack[local_scope_num] = hashInit();
            }
        };
        // ***** 変数を削除する(staticメソッド) *****
        Vars.deleteVar = function (var_obj, array_indexes) {
            var i;
            var scope_no;
            var now_vars;
            var var_name;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name;
            if (array_indexes) { // 配列変数対応
                for (i = 0; i < array_indexes.length; i++) {
                    var_name += "$" + array_indexes[i];
                }
            }
            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            // ***** 変数を削除する *****
            // if (now_vars.hasOwnProperty(var_name)) {
            // if (hasOwn.call(now_vars, var_name)) {
            if (now_vars[var_name] != null) {
                delete now_vars[var_name];
            }
        };
        // ***** 変数の存在チェック(staticメソッド) *****
        Vars.checkVar = function (var_obj, array_indexes) {
            var i;
            var scope_no;
            var now_vars;
            var var_name;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name;
            if (array_indexes) { // 配列変数対応
                for (i = 0; i < array_indexes.length; i++) {
                    var_name += "$" + array_indexes[i];
                }
            }
            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            // ***** 変数の存在チェック *****
            // if (now_vars.hasOwnProperty(var_name)) {
            // if (hasOwn.call(now_vars, var_name)) {
            if (now_vars[var_name] != null) {
                return true;
            }
            return false;
        };
        // ***** 変数の値を取得する(staticメソッド) *****
        Vars.getVarValue = function (var_obj, array_indexes) {
            var i;
            var scope_no;
            var now_vars;
            var var_name;
            var num;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name;
            if (array_indexes) { // 配列変数対応
                for (i = 0; i < array_indexes.length; i++) {
                    var_name += "$" + array_indexes[i];
                }
            }
            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            // ***** 変数の値を取得する *****
            // if (now_vars.hasOwnProperty(var_name)) {
            // if (hasOwn.call(now_vars, var_name)) {
            //     return now_vars[var_name];
            // }
            num = now_vars[var_name];
            if (num != null) { return num; }
            now_vars[var_name] = 0;
            return 0;
        };
        // ***** 変数の値を設定する(staticメソッド) *****
        Vars.setVarValue = function (var_obj, num, array_indexes) {
            var i;
            var scope_no;
            var now_vars;
            var var_name;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name;
            if (array_indexes) { // 配列変数対応
                for (i = 0; i < array_indexes.length; i++) {
                    var_name += "$" + array_indexes[i];
                }
            }
            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            // ***** 変数の値を設定する *****
            now_vars[var_name] = num;
        };
        // ***** 配列変数の一括コピー(staticメソッド) *****
        Vars.copyArray = function (var_obj, var_obj2) {
            var i;
            var scope_no;
            var scope_no2;
            var now_vars;
            var now_vars2;
            var var_name;
            var var_name2;
            var var_name_len;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            scope_no2 = use_local_vars ? checkType(var_obj2) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name + "$";
            var_name2 = var_obj2.name + "$";

            // ***** コピー元とコピー先の配列変数名が一致するときはエラーにする *****
            // (例えば、a[]をa[1][]にコピーすると無限ループのおそれがある)
            i = var_name2.indexOf(var_name);
            if (i == 0) {
                var_name = var_name.substring(0, var_name.length - 1);
                throw new Error("コピー元とコピー先の配列変数名が同一です。('" + var_name + "')");
            }

            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            now_vars2 = vars_stack[scope_no2];
            // ***** 配列変数の一括コピー *****
            var_name_len = var_name.length;
            controlArray(now_vars, var_name, var_name_len, function (v) {
                var var_name_to = var_name2 + v.substring(var_name_len);
                now_vars2[var_name_to] = now_vars[v];
            });
        };
        // ***** 配列変数の一括削除(staticメソッド) *****
        Vars.deleteArray = function (var_obj) {
            var scope_no;
            var now_vars;
            var var_name;
            var var_name_len;

            // ***** 変数のタイプチェック *****
            scope_no = use_local_vars ? checkType(var_obj) : 0;
            // ***** 変数名を取得 *****
            var_name = var_obj.name + "$";
            // ***** グローバル/ローカル変数のスコープを取得 *****
            now_vars = vars_stack[scope_no];
            // ***** 配列変数の一括削除 *****
            var_name_len = var_name.length;
            controlArray(now_vars, var_name, var_name_len, function (v) {
                delete now_vars[v];
            });
        };
        return Vars; // これがないとクラスが動かないので注意
    })();

    // ***** GUI関連処理等 *****

    // ***** キーボード処理 *****
    function keydown(ev) {
        var key_code;
        var num;
        // ***** IE8対策 *****
        ev = ev || window.event;
        key_code = ev.keyCode;
        // ***** プログラムの実行中は ブラウザのスクロール等を抑制する *****
        if (running_flag) {
            // ***** スペース/矢印/PageUp/PageDown/Home/Endキーを無効化 *****
            if (key_code >= 32 && key_code <= 40) {
                // ***** IE8対策 *****
                if (ev.preventDefault) {
                    ev.preventDefault();
                } else {
                    ev.returnValue = false;
                }
            }
        }
        // ***** キーダウン *****
        key_down_stat[key_code] = true;
        key_down_code = key_code;
        // ***** 携帯のキーコードに変換 *****
        if (phone_key_code.hasOwnProperty(key_code)) {
            num = phone_key_code[key_code];
            // ***** キースキャン状態を更新 *****
            key_scan_stat |= num; // ビットをON
            // ***** キー入力バッファ1に追加 *****
            if (input_buf.length >= input_buf_size) { input_buf.shift(); }
            input_buf.push(num);
            // ***** キー入力待ちならば解除 *****
            if (input_flag && sleep_id != null) {
                clearTimeout(sleep_id);
                run_continuously();
            }
        }
        // ***** スペースキーのとき *****
        // スペースキーを上で無効化したためkeypressが発生しないので、ここで処理する
        if (key_code == 32) {
            key_press_code = 32;
            // ***** キー入力バッファ2に追加 *****
            if (keyinput_buf.length >= input_buf_size) { keyinput_buf.shift(); }
            keyinput_buf.push(key_press_code);
            // ***** キー入力待ちならば解除 *****
            if (keyinput_flag && sleep_id != null) {
                clearTimeout(sleep_id);
                run_continuously();
            }
        }
    }
    function keyup(ev) {
        var key_code;
        var num;
        // ***** IE8対策 *****
        ev = ev || window.event;
        key_code = ev.keyCode;
        // ***** キーアップ *****
        key_down_stat[key_code] = false;
        key_down_code = 0;
        key_press_code = 0;
        // ***** 携帯のキーコードに変換 *****
        if (phone_key_code.hasOwnProperty(key_code)) {
            num = phone_key_code[key_code];
            // ***** キースキャン状態を更新 *****
            key_scan_stat &= ~num; // ビットをOFF
        }
    }
    function keypress(ev) {
        var key_code;
        // ***** IE8対策 *****
        ev = ev || window.event;
        key_code = ev.keyCode;
        // ***** キープレス *****
        key_press_code = key_code;
        // ***** キー入力バッファ2に追加 *****
        if (keyinput_buf.length >= input_buf_size) { keyinput_buf.shift(); }
        keyinput_buf.push(key_press_code);
        // ***** キー入力待ちならば解除 *****
        if (keyinput_flag && sleep_id != null) {
            clearTimeout(sleep_id);
            run_continuously();
        }
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
        key_scan_stat = 0;
        key_down_code = 0;
        key_press_code = 0;
    }

    // ***** マウス処理 *****
    function mousedown(ev) {
        var btn_code;
        // ***** マウスボタン状態を取得 *****
        btn_code = ev.button;
        // ***** FlashCanvas用 *****
        if (typeof (FlashCanvas) != "undefined") {
            if (btn_code == 1) { btn_code =  0; } // 中ボタンは左ボタンに変換
            if (btn_code == 2) { btn_code = -1; } // 右ボタンは無効化
        }
        if (btn_code >= 0) { mouse_btn_stat[btn_code] = true; }
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
        var btn_code;
        // ***** マウスボタン状態を取得 *****
        btn_code = ev.button;
        // ***** FlashCanvas用 *****
        if (typeof (FlashCanvas) != "undefined") {
            if (btn_code == 1) { btn_code =  0; } // 中ボタンは左ボタンに変換
            if (btn_code == 2) { btn_code = -1; } // 右ボタンは無効化
        }
        if (btn_code >= 0) { mouse_btn_stat[btn_code] = false; }
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

    // ***** Canvasの各種設定の初期化 *****
    function init_canvas_setting(ctx) {
        // ***** フォント設定 *****
        // (フォントサイズだけはリセットしない(過去との互換性維持のため))
        // if (sp_compati_flag) {
        //     font_size = font_size_set[0];
        // } else {
        //     font_size = font_size_set[1];
        // }
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
        axis = {};
        axis.originx  = 0; // 座標系の原点座標X(px)
        axis.originy  = 0; // 座標系の原点座標Y(px)
        axis.rotate   = 0; // 座標系の回転の角度(rad)
        axis.rotateox = 0; // 座標系の回転の中心座標X(px)
        axis.rotateoy = 0; // 座標系の回転の中心座標Y(px)
        axis.scalex   = 1; // 座標系の拡大縮小のX方向倍率
        axis.scaley   = 1; // 座標系の拡大縮小のY方向倍率
        axis.scaleox  = 0; // 座標系の拡大縮小の中心座標X(px)
        axis.scaleoy  = 0; // 座標系の拡大縮小の中心座標Y(px)
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を初期化
        // ***** 現在状態を保存 *****
        ctx.save();
    }
    // ***** Canvasの各種設定のリセット *****
    function reset_canvas_setting(ctx) {
        // ***** 前回状態に復帰 *****
        ctx.restore();
        // ***** Canvasの各種設定の初期化 *****
        init_canvas_setting(ctx);
    }
    // ***** Canvasの各種設定のリセット2(設定内容は保持) *****
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
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
        set_canvas_axis(ctx);               // 座標系を再設定
        // ***** 現在状態を再び保存 *****
        ctx.save();
    }
    // ***** Canvasの座標系の設定 *****
    // (基本的に座標系を元に戻してから呼ぶこと)
    function set_canvas_axis(ctx) {
        // (これらの変換は、記述と逆の順番で実行されるので注意)
        ctx.translate( axis.originx,   axis.originy);  // 原点座標を移動
        ctx.translate( axis.rotateox,  axis.rotateoy); // 回転の中心座標を元に戻す
        ctx.rotate(axis.rotate);                       // 回転の角度を指定
        ctx.translate(-axis.rotateox, -axis.rotateoy); // 回転の中心座標を移動
        ctx.translate( axis.scaleox,   axis.scaleoy);  // 拡大縮小の中心座標を元に戻す
        ctx.scale(axis.scalex, axis.scaley);           // 拡大縮小の倍率を指定
        ctx.translate(-axis.scaleox,  -axis.scaleoy);  // 拡大縮小の中心座標を移動
    }
    // ***** Canvasの座標変換 *****
    // (グラフィック上の座標(x,y)から、
    //  実際の画面上の座標(x1,y1)を計算して、配列にして返す)
    function conv_axis_point(x, y) {
        var x1, y1, t;
        // ***** 座標系の変換の分を補正 *****
        x1 = x;
        y1 = y;
        x1 -= axis.scaleox;  // 拡大縮小の中心座標を移動
        y1 -= axis.scaleoy;
        x1 *= axis.scalex;   // 拡大縮小
        y1 *= axis.scaley;
        x1 += axis.scaleox;  // 拡大縮小の中心座標を元に戻す
        y1 += axis.scaleoy;
        x1 -= axis.rotateox; // 回転の中心座標を移動
        y1 -= axis.rotateoy;
        // ここでtを使わないと、計算結果がおかしくなるので注意
        t  = x1 * Math.cos(axis.rotate) - y1 * Math.sin(axis.rotate); // 回転
        y1 = x1 * Math.sin(axis.rotate) + y1 * Math.cos(axis.rotate);
        x1 = t;
        x1 += axis.rotateox; // 回転の中心座標を元に戻す
        y1 += axis.rotateoy;
        x1 += axis.originx;  // 原点座標を移動
        y1 += axis.originy;
        x1 |= 0; // 整数化
        y1 |= 0; // 整数化
        return [x1, y1];
    }

    // ***** ソフトキー表示 *****
    function disp_softkeys() {
        var text_st;
        // ***** ソフトキー表示エリアのクリアと表示 *****
        ctx2.clearRect(0, 0, can2.width, can2.height);
        ctx2.fillStyle = can2_forecolor_init;
        ctx2.textAlign = "left";
        ctx2.textBaseline = "top";
        text_st = softkeys[0].text;
        if (text_st != "") {
            ctx2.font = softkeys[0].font_size + "px " + font_family;
            if (text_st.charAt(0) == "*") {
                text_st = text_st.substring(1);
            } else {
                text_st = "[c]:" + text_st;
            }
            ctx2.fillText(text_st, 0, 2);
        }
        ctx2.textAlign = "right";
        text_st = softkeys[1].text;
        if (text_st != "") {
            ctx2.font = softkeys[1].font_size + "px " + font_family;
            if (text_st.charAt(0) == "*") {
                text_st = text_st.substring(1);
            } else {
                text_st = "[v]:" + text_st;
            }
            ctx2.fillText(text_st, can2.width, 2);
        }
    }

    // ****************************************
    //              命令の定義処理
    // ****************************************

    // ***** 組み込み関数の定義情報の生成 *****
    function make_func_tbl() {
        // ***** 組み込み関数の定義情報を1個ずつ生成 *****
        // (第2引数は関数の引数の数を指定する(ただし省略可能な引数は数に入れない))
        // (第2引数を-1にすると組み込み変数になり、()なしで呼び出せる)
        // (第3引数は「変数名をとる引数」がある場合にその引数番号を配列で指定する)
        // (戻り値なしの組み込み関数の戻り値は nothing とする)
        make_one_func_tbl("abs", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.abs(a1);
            return num;
        });
        make_one_func_tbl("acos", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.acos(a1) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl("arc", 3, [], function (param) {
            var a1, a2, a3, a4;
            var i;
            var a, b, x0, y0;
            var r1, c1;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            if (param.length <= 3) {
                a4 = a3;
            } else {
                a4 = (+param[3]); // H
            }
            if (a3 == a4) {
                a = a3 / 2;  // 半径
                x0 = a1 + a; // 中心のX座標
                y0 = a2 + a; // 中心のY座標
                ctx.beginPath();
                ctx.arc(x0, y0, a, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.stroke();
            } else {
                a = a3 / 2;  // X方向の半径
                b = a4 / 2;  // Y方向の半径
                x0 = a1 + a; // 中心のX座標
                y0 = a2 + b; // 中心のY座標
                ctx.beginPath();
                ctx.moveTo(a + x0, y0);
                r1 = 0;
                c1 = 2 * Math.PI / 100;
                for (i = 1; i < 100; i++) {
                    // ctx.lineTo(a * Math.cos(2 * Math.PI * i / 100) + x0, b * Math.sin(2 * Math.PI * i / 100) + y0);
                    ctx.lineTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                    r1 += c1;
                }
                ctx.closePath();
                ctx.stroke();
                // 以下は不要になったもよう(Chrome v27)
                // // ***** Chrome v23 で円が閉じない件の対策(中心を0.5ずらしたとき) *****
                // ctx.fillRect(a + x0, y0, 0.5, 0.5);
            }
            return nothing;
        });
        make_one_func_tbl("arraylen", 1, [0], function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = get_var_obj(param[0]);
            if (param.length <= 1) {
                a2 = 0;
                a3 = null;
            } else {
                a2 = Math.trunc(param[1]);
                if (param.length <= 2) {
                    a3 = null;
                } else {
                    a3 = Math.trunc(param[2]);
                }
            }

            // ***** NaN対策 *****
            a2 |= 0;

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
                if (Vars.checkVar(a1, [i])) {
                    num++;
                } else if (a3 == null) {
                    break;
                }
                i++;
            } while (a3 == null || i <= a3);
            return num;
        });
        make_one_func_tbl("asin", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.asin(a1) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl("atan", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.atan(a1) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl("atan2", 2, [], function (param) {
            var num;
            var a1, a2;

            a1 = (+param[0]);
            a2 = (+param[1]);
            // num = Math.atan2(a2, a1) * 180 / Math.PI;
            num = Math.atan2(a1, a2) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl("ceil", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.ceil(a1);
            return num;
        });
        make_one_func_tbl("chkvar", 1, [0], function (param) {
            var num;
            var a1;

            a1 = get_var_obj(param[0]);
            if (Vars.checkVar(a1)) { num = 1; } else { num = 0; }
            return num;
        });
        make_one_func_tbl("clear", 4, [], function (param) {
            var a1, a2, a3, a4;

            a1 = Math.trunc(param[0]); // X
            a2 = Math.trunc(param[1]); // Y
            a3 = Math.trunc(param[2]); // W
            a4 = Math.trunc(param[3]); // H
            ctx.clearRect(a1, a2, a3, a4);
            return nothing;
        });
        make_one_func_tbl("clearkey", 0, [], function (param) {
            input_buf = [];
            keyinput_buf = [];
            return nothing;
        });
        make_one_func_tbl("clearvar", 0, [], function (param) {
            var name;

            // vars = {};
            Vars.clearVars();
            imgvars = {};
            // ***** プラグイン用の全変数クリア時処理 *****
            for (name in clear_var_funcs) {
                if (clear_var_funcs.hasOwnProperty(name)) {
                    clear_var_funcs[name]();
                }
            }
            return nothing;
        });
        make_one_func_tbl("clip", 4, [], function (param) {
            var a1, a2, a3, a4;

            a1 = Math.trunc(param[0]); // X
            a2 = Math.trunc(param[1]); // Y
            a3 = Math.trunc(param[2]); // W
            a4 = Math.trunc(param[3]); // H

            // ***** Canvasの各種設定のリセット2 *****
            reset_canvas_setting2(ctx); // clipを解除する方法がrestoreしかない

            ctx.beginPath();
            ctx.rect(a1, a2, a3, a4);
            ctx.clip();
            return nothing;
        });
        make_one_func_tbl("cls", 0, [], function (param) {
            // ***** 画面クリア *****
            // ctx.clearRect(-axis.originx, -axis.originy, can.width, can.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            ctx.clearRect(0, 0, can.width, can.height);  // 画面クリア
            set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("col", 1, [], function (param) {
            var a1;
            var col_r, col_g, col_b;

            a1 = Math.trunc(param[0]); // RGB
            col_r = (a1 & 0xff0000) >> 16; // R
            col_g = (a1 & 0x00ff00) >> 8;  // G
            col_b = (a1 & 0x0000ff);       // B
            color_val = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            return nothing;
        });
        make_one_func_tbl("color", 3, [], function (param) {
            var a1, a2, a3;

            a1 = Math.trunc(param[0]); // R
            a2 = Math.trunc(param[1]); // G
            a3 = Math.trunc(param[2]); // B
            color_val = "rgb(" + a1 + "," + a2 + "," + a3 + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            return nothing;
        });
        make_one_func_tbl("copy", 5, [0, 2], function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var i_start, i_end, i_plus;

            a1 = get_var_obj(param[0]);
            a2 = Math.trunc(param[1]);
            a3 = get_var_obj(param[2]);
            a4 = Math.trunc(param[3]);
            a5 = Math.trunc(param[4]);

            // ***** NaN対策 *****
            a2 |= 0;
            a4 |= 0;
            a5 |= 0;

            // ***** エラーチェック *****
            // if (a5 > max_array_size) {
            if (!(a5 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。" + max_array_size + "以下である必要があります。");
            }
            if (a5 <= 0) { return nothing; }

            // ***** コピー処理 *****
            // if (a1 == a3 && a2 < a4) {
            if (a1.name == a3.name && a2 < a4) {
                // (後から処理)
                i_start = a5 - 1;
                i_end   =  0;
                i_plus  = -1;
            } else {
                // (前から処理)
                i_start =  0;
                i_end   = a5 - 1;
                i_plus  =  1;
            }
            i = i_start;
            while (true) {

                // // ***** 配列の存在チェック *****
                // if (!Vars.checkVar(a1, [a2 + i])) { break; }

                // a6 = vars[a1 + "[" + (a2 + i) + "]"];
                a6 = Vars.getVarValue(a1, [a2 + i]);
                // vars[a3 + "[" + (a4 + i) + "]"] = a6;
                Vars.setVarValue(a3, a6, [a4 + i]);
                i += i_plus;
                if ((i_plus > 0 && i <= i_end) ||
                    (i_plus < 0 && i >= i_end)) { continue; }
                break;
            }
            return nothing;
        });
        make_one_func_tbl("copyall", 2, [0, 1], function (param) {
            var a1, a2;

            a1 = get_var_obj(param[0]);
            a2 = get_var_obj(param[1]);
            // ***** 配列変数の一括コピー *****
            Vars.copyArray(a1, a2);
            return nothing;
        });
        make_one_func_tbl("cos", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if (sp_compati_flag) {
                num = Math.trunc(Math.cos(a1 * Math.PI / 180) * 100);
            } else {
                num = Math.cos(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl("day", -1, [], function (param) {
            var num;

            num = new Date().getDate();
            return num;
        });
        make_one_func_tbl("dayofweek", -1, [], function (param) {
            var num;

            num = new Date().getDay() + 1; // =1:日曜日,=2:月曜日 ... =7:土曜日
            return num;
        });
        make_one_func_tbl("dbgdrawfix", 0, [], function (param) {
            var a1;
            // ***** Chrome v57 の Canvas の 不具合対策 *****
            // Chrome で GPU使用あり設定 (accelerated-2d-canvas : ON) のとき、
            // 256x256 より大きい Canvas を生成して、getImageData → drawImage
            // の順に実行すると、Canvas の表示が更新されない状態になる。
            // このとき、HTML上で何か表示を変更すると、復旧する。
            // (Intel HD Graphics 5500 で確認)
            a1 = document.getElementById("draw_fix1").textContent;
            document.getElementById("draw_fix1").textContent = (a1 != ".") ? "." : "";
            return nothing;
        });
        make_one_func_tbl("dbgloopset", 1, [], function (param) {
            var a1;

            a1 = Math.trunc(param[0]);
            if (a1 == 0) {
                loop_nocount_flag1 = true;
                // (ループ時間ノーカウントフラグ2をOFFにして、処理時間の測定をリセットする)
                loop_nocount_flag2 = false;
            } else {
                loop_nocount_flag1 = true;
                // (ループ時間ノーカウントフラグ2をONにして、ノーカウントの状態を延長する)
                loop_nocount_flag2 = true;
            }
            return nothing;
        });
        make_one_func_tbl("dbgpointer", 1, [0], function (param) {
            var a1, a2;
            var var_obj;
            var text_st;

            a1 = get_var_obj(param[0]);
            if (param.length <= 1) {
                a2 = 1;
            } else {
                a2 = Math.trunc(param[1]);
            }
            var_obj = Vars.getVarValue(a1);
            text_st = a1.name + " = " + JSON.stringify(var_obj);
            if (a2 != 0) { text_st += "\n"; }
            DebugShow(text_st);
            return nothing;
        });
        make_one_func_tbl("dbgprint", 1, [], function (param) {
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = 1;
            } else {
                a2 = Math.trunc(param[1]);
            }
            if (a2 != 0) { a1 += "\n"; }
            DebugShow(a1);
            return nothing;
        });
        make_one_func_tbl("dbgstop", 0, [], function (param) {
            var a1;

            if (param.length <= 0) {
                a1 = "";
            } else {
                a1 = String(param[0]);
            }
            if (a1 != "") { a1 = "('" + a1 + "')"; }
            throw new Error("dbgstop 命令で停止しました。" + a1);
            // return nothing;
        });
        make_one_func_tbl("dcos", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.cos(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl("devpixratio", -1, [], function (param) {
            var num;

            if (window.devicePixelRatio) {
                num = window.devicePixelRatio;
            } else {
                num = 0;
            }
            return num;
        });
        make_one_func_tbl("disarray", 1, [0], function (param) {
            var a1, a2, a3;
            var i;

            a1 = get_var_obj(param[0]);
            if (param.length <= 1) {
                a2 = null;
                a3 = 0;
            } else {
                a2 = Math.trunc(param[1]);
                if (param.length <= 2) {
                    a3 = a2 - 1;
                    a2 = 0;
                } else {
                    a3 = Math.trunc(param[2]);
                }
            }

            // ***** エラーチェック *****
            // if (a2 != null && (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size)) {
            if (!(a2 == null || (a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size))) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            if (a2 == null) {
                // ***** 配列変数の一括削除 *****
                Vars.deleteArray(a1);
            } else {
                for (i = a2; i <= a3; i++) {
                    // delete vars[a1 + "[" + i + "]"];
                    Vars.deleteVar(a1, [i]);
                }
            }
            return nothing;
        });
        make_one_func_tbl("disimg", 1, [0], function (param) {
            var a1;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                delete imgvars[a1];
            }
            // for (var prop_name in imgvars) { DebugShow(prop_name + " "); } DebugShow("\n");
            return nothing;
        });
        make_one_func_tbl("disvar", 1, [0], function (param) {
            var a1;

            a1 = get_var_obj(param[0]);
            // delete vars[a1];
            Vars.deleteVar(a1);
            return nothing;
        });
        make_one_func_tbl("download", 1, [], function (param) {
            var num;
            var a1, a2, a3;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = "";
                a3 = 0;
            } else {
                a2 = String(param[1]);
                if (param.length <= 2) {
                    a3 = 0;
                } else {
                    a3 = Math.trunc(param[2]);
                }
            }
            if (a3 != 1) {
                if (typeof (Download) == "function") {
                    Download.download(a1, a2);
                } else {
                    window.location.href = "data:application/octet-stream," + encodeURIComponent(a1);
                }
            }
            num = "data:text/plain;charset=utf-8," + encodeURIComponent(a1);
            return num;
        });
        make_one_func_tbl("downloadimg", 0, [], function (param) {
            var num;
            var a1, a2;

            if (param.length <= 0) {
                a1 = "";
                a2 = 0;
            } else {
                a1 = String(param[0]);
                if (param.length <= 1) {
                    a2 = 0;
                } else {
                    a2 = Math.trunc(param[1]);
                }
            }
            if (a2 != 1) {
                if (typeof (Download) == "function") {
                    Download.downloadCanvas(can, a1);
                } else {
                    window.location.href = can.toDataURL("image/png").replace("image/png", "image/octet-stream");
                }
            }
            num = can.toDataURL("image/png");
            return num;
        });
        make_one_func_tbl("dpow", 2, [], function (param) {
            var num;
            var a1, a2;

            a1 = (+param[0]);
            a2 = (+param[1]);
            num = Math.pow(a1, a2);
            return num;
        });
        make_one_func_tbl("drawarea", 7, [0], function (param) {
            var a1, a2, a3, a4, a5, a6, a7;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // 先X
            a3 = Math.trunc(param[2]); // 先Y
            a4 = Math.trunc(param[3]); // 元X
            a5 = Math.trunc(param[4]); // 元Y
            a6 = Math.trunc(param[5]); // W
            a7 = Math.trunc(param[6]); // H
            if (a1 == "screen") {
                // ***** 画像を描画(表示画面→ターゲット) *****
                ctx.drawImage(can1, a4, a5, a6, a7, a2, a3, a6, a7);
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // ***** 画像を描画(画像変数→ターゲット) *****
                    ctx.drawImage(imgvars[a1].can, a4, a5, a6, a7, a2, a3, a6, a7);
                } else {
                    throw new Error("Image「" + a1 + "」がロードされていません。");
                }
            }
            return nothing;
        });
        make_one_func_tbl("drawimg", 4, [0], function (param) {
            var a1, a2, a3, a4;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // X
            a3 = Math.trunc(param[2]); // Y
            a4 = Math.trunc(param[3]); // アンカー
            if (a1 == "screen") {
                // ***** 水平方向 *****
                // if (a4 & 4)   { }                        // 左
                if (a4 & 8)      { a2 -= can1.width; }      // 右
                else if (a4 & 1) { a2 -= can1.width / 2; }  // 中央
                // ***** 垂直方向 *****
                // if (a4 & 16)  { }                        // 上
                if (a4 & 32)     { a3 -= can1.height; }     // 下
                else if (a4 & 2) { a3 -= can1.height / 2; } // 中央
                // ***** 画像を描画(表示画面→ターゲット) *****
                ctx.drawImage(can1, a2, a3);
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // ***** 水平方向 *****
                    // if (a4 & 4)   { }                                   // 左
                    if (a4 & 8)      { a2 -= imgvars[a1].can.width; }      // 右
                    else if (a4 & 1) { a2 -= imgvars[a1].can.width / 2; }  // 中央
                    // ***** 垂直方向 *****
                    // if (a4 & 16)  { }                                   // 上
                    if (a4 & 32)     { a3 -= imgvars[a1].can.height; }     // 下
                    else if (a4 & 2) { a3 -= imgvars[a1].can.height / 2; } // 中央
                    // ***** 画像を描画(画像変数→ターゲット) *****
                    ctx.drawImage(imgvars[a1].can, a2, a3);
                } else {
                    throw new Error("Image「" + a1 + "」がロードされていません。");
                }
            }
            return nothing;
        });
        make_one_func_tbl("drawimgex", 9, [0], function (param) {
            var a1, a2, a3, a4, a5, a6, a7, a8, a9;
            var can0;
            var img_w, img_h;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // 元X
            a3 = Math.trunc(param[2]); // 元Y
            a4 = Math.trunc(param[3]); // 元W
            a5 = Math.trunc(param[4]); // 元H
            a6 = Math.trunc(param[5]); // 変換
            a7 = Math.trunc(param[6]); // 先X
            a8 = Math.trunc(param[7]); // 先Y
            a9 = Math.trunc(param[8]); // アンカー

            // ***** コピー元の画像を取得 *****
            if (a1 == "screen") {
                // (表示画面をコピー元とする)
                can0 = can1;
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // (画像変数をコピー元とする)
                    can0 = imgvars[a1].can;
                } else {
                    throw new Error("Image「" + a1 + "」がロードされていません。");
                }
            }

            // ***** アンカーの座標を計算 *****
            if (a6 >= 4 && a6 <= 7) { // 90度か270度回転のとき
                img_w = a5;
                img_h = a4;
            } else {
                img_w = a4;
                img_h = a5;
            }
            // (水平方向の座標を計算)
            // if (a9 & 4)   { }                  // 左
            if (a9 & 8)      { a7 -= img_w; }     // 右
            else if (a9 & 1) { a7 -= img_w / 2; } // 中央
            // (垂直方向の座標を計算)
            // if (a9 & 16)  { }                  // 上
            if (a9 & 32)     { a8 -= img_h; }     // 下
            else if (a9 & 2) { a8 -= img_h / 2; } // 中央

            // ***** 描画処理 *****
            ctx.save();
            ctx.translate(a7, a8); // 平行移動
            switch (a6) {
                // case 0: // 回転なし
                //     break;
                case 1: // 上下反転(=左右反転+180度回転)
                    ctx.translate(0, a5);
                    ctx.scale(1, -1);
                    break;
                case 2: // 左右反転(=左右反転+回転なし)
                    ctx.translate(a4, 0);
                    ctx.scale(-1, 1);
                    break;
                case 3: // 180度回転(=左右反転+上下反転)
                    ctx.translate(a4, a5);
                    ctx.scale(-1, -1);
                    break;
                case 4: // 左右反転+270度回転
                    ctx.rotate(-Math.PI / 2);
                    ctx.scale(-1, 1);
                    break;
                case 5: // 90度回転
                    ctx.translate(a5, 0);
                    ctx.rotate(Math.PI / 2);
                    break;
                case 6: // 270度回転
                    ctx.translate(0, a4);
                    ctx.rotate(-Math.PI / 2);
                    break;
                case 7: // 左右反転+90度回転
                    ctx.translate(a5, a4);
                    ctx.rotate(Math.PI / 2);
                    ctx.scale(-1, 1);
                    break;
            }
            // ctx.drawImage(can0, a2, a3, a4, a5, a7, a8, a4, a5);
            ctx.drawImage(can0, a2, a3, a4, a5, 0, 0, a4, a5);
            ctx.restore();
            return nothing;
        });
        make_one_func_tbl("drawscaledimg", 9, [0], function (param) {
            var a1, a2, a3, a4, a5, a6, a7, a8, a9;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // 先X
            a3 = Math.trunc(param[2]); // 先Y
            a4 = Math.trunc(param[3]); // 先W
            a5 = Math.trunc(param[4]); // 先H
            a6 = Math.trunc(param[5]); // 元X
            a7 = Math.trunc(param[6]); // 元Y
            a8 = Math.trunc(param[7]); // 元W
            a9 = Math.trunc(param[8]); // 元H
            if (a1 == "screen") {
                // ***** 画像を描画(表示画面→ターゲット) *****
                ctx.drawImage(can1, a6, a7, a8, a9, a2, a3, a4, a5);
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // ***** 画像を描画(画像変数→ターゲット) *****
                    ctx.drawImage(imgvars[a1].can, a6, a7, a8, a9, a2, a3, a4, a5);
                } else {
                    throw new Error("Image「" + a1 + "」がロードされていません。");
                }
            }
            return nothing;
        });
        make_one_func_tbl("dsin", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.sin(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl("dtan", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.tan(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl("exp", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.exp(a1);
            return num;
        });
        make_one_func_tbl("farc", 3, [], function (param) {
            var a1, a2, a3, a4;
            var i;
            var a, b, x0, y0;
            var r1, c1;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            if (param.length <= 3) {
                a4 = a3;
            } else {
                a4 = (+param[3]); // H
            }
            if (a3 == a4) {
                a = a3 / 2;  // 半径
                x0 = a1 + a; // 中心のX座標
                y0 = a2 + a; // 中心のY座標
                ctx.beginPath();
                ctx.arc(x0, y0, a, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            } else {
                a = a3 / 2;  // X方向の半径
                b = a4 / 2;  // Y方向の半径
                x0 = a1 + a; // 中心のX座標
                y0 = a2 + b; // 中心のY座標
                ctx.beginPath();
                ctx.moveTo(a + x0, y0);
                r1 = 0;
                c1 = 2 * Math.PI / 100;
                for (i = 1; i < 100; i++) {
                    // ctx.lineTo(a * Math.cos(2 * Math.PI * i / 100) + x0, b * Math.sin(2 * Math.PI * i / 100) + y0);
                    ctx.lineTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                    r1 += c1;
                }
                ctx.closePath();
                // 以下は不要になったもよう(Chrome v27)
                // // ***** Chrome v23 で塗りつぶさない件の対策 *****
                // ctx.rect(x0, y0, 1, 1);     // 真ん中に小さな四角を描くと、塗りつぶしエリアが反転するもよう
                ctx.fill();
                // 以下は不要になったもよう(Chrome v24)
                // ctx.fillRect(x0, y0, 1, 1); // 反転して抜けた真ん中の小さな四角をさらに塗りつぶす
            }
            return nothing;
        });
        make_one_func_tbl("floor", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.floor(a1);
            return num;
        });
        make_one_func_tbl("foval", 6, [], function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var a, b, x0, y0;
            var rad1, rad2;
            var r1, c1;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            a5 = (+param[4]); // 開始角
            a6 = (+param[5]); // 描画角
            a = a3 / 2;  // X方向の半径
            b = a4 / 2;  // Y方向の半径
            x0 = a1 + a; // 中心のX座標
            y0 = a2 + b; // 中心のY座標
            rad1 = - a5 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
            rad2 = - a6 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
            if (rad2 < 0) { // パスを右巻きに統一する
                rad1 += rad2;
                rad2 = -rad2;
            }
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            r1 = rad1;
            c1 = rad2 / 100;
            for (i = 0; i <= 100; i++) {
                // ctx.lineTo(a * Math.cos(rad1 + rad2 * i / 100) + x0, b * Math.sin(rad1 + rad2 * i / 100) + y0);
                ctx.lineTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                r1 += c1;
            }
            ctx.closePath();
            // 以下は不要になったもよう(Chrome v27)
            // // ***** Chrome v23 で塗りつぶさない件の対策 *****
            // ctx.rect(x0, y0, 1, 1);     // 真ん中に小さな四角を描くと、塗りつぶしエリアが反転するもよう
            ctx.fill();
            // 以下は不要になったもよう(Chrome v24)
            // ctx.fillRect(x0, y0, 1, 1); // 反転して抜けた真ん中の小さな四角をさらに塗りつぶす
            return nothing;
        });
        make_one_func_tbl("frect", 4, [], function (param) {
            var a1, a2, a3, a4;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            ctx.fillRect(a1, a2, a3, a4);
            return nothing;
        });
        make_one_func_tbl("fround", 6, [], function (param) {
            var a1, a2, a3, a4, a5, a6;
            var rx, ry;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            a5 = (+param[4]); // RX
            a6 = (+param[5]); // RY
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
            // ctx.rotate(45 * Math.PI / 180);     // 回転させるとなぜか描画する
            ctx.fill();
            // 以下は不要になったもよう(Chrome v27)
            // ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            // set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("funccall", 1, [1], function (param) {
            var a1, a2;

            a1 = param[0];
            if (param.length >= 2) {
                a2 = get_var_obj(param[1]);
                // vars[a2] = a1;
                Vars.setVarValue(a2, a1);
            }
            return nothing;
        });
        make_one_func_tbl("funcgoto", 1, [], function (param) {
            // ***** NOP *****
            return nothing;
        });
        make_one_func_tbl("gc", 0, [], function (param) {
            // ***** NOP *****
            return nothing;
        });
        make_one_func_tbl("getoutdata", 1, [], function (param) {
            var num;
            var a1;

            a1 = Math.trunc(param[0]);
            if (out_data.hasOwnProperty(a1)) { num = out_data[a1]; } else { num = ""; }
            return num;
        });
        make_one_func_tbl("getpixel", 2, [], function (param) {
            var num;
            var a1, a2;
            var x1, y1;
            var ret_array = [];
            var img_data = {};

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            // ***** 座標系の変換の分を補正 *****
            ret_array = conv_axis_point(a1, a2);
            x1 = ret_array[0];
            y1 = ret_array[1];

            // ***** エラーチェック *****
            // if (x1 < 0 || x1 >= can.width || y1 < 0 || y1 >= can.height) { num = 0; return num; }
            if (!(x1 >= 0 && x1 < can.width && y1 >= 0 && y1 < can.height)) { num = 0; return num; }

            // ***** 画像データを取得 *****
            img_data = ctx.getImageData(x1, y1, 1, 1);
            // ***** 色情報を取得 *****
            num = (img_data.data[0] << 16) | (img_data.data[1] << 8) | img_data.data[2];
            return num;
        });
        make_one_func_tbl("height", -1, [], function (param) {
            var num;

            num = can1.height;
            return num;
        });
        make_one_func_tbl("hour", -1, [], function (param) {
            var num;

            num = new Date().getHours();
            return num;
        });
        make_one_func_tbl("imgheight", 1, [0], function (param) {
            var num;
            var a1;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                num = imgvars[a1].can.height;
            } else { num = 0; }
            return num;
        });
        make_one_func_tbl("imgwidth", 1, [0], function (param) {
            var num;
            var a1;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                num = imgvars[a1].can.width;
            } else { num = 0; }
            return num;
        });
        make_one_func_tbl("index", 2, [], function (param) {
            var num;
            var a1, a2, a3;

            a1 = String(param[0]);
            a2 = String(param[1]);
            if (param.length <= 2) {
                a3 = 0;
            } else {
                a3 = Math.trunc(param[2]);
            }
            num = a1.indexOf(a2, a3);
            return num;
        });
        make_one_func_tbl("input", 0, [], function (param) {
            var num;
            var a1;
            var repeat_flag;

            if (param.length <= 0) {
                a1 = 0;
                repeat_flag = true;
            } else {
                a1 = Math.trunc(param[0]);
                repeat_flag = false;
            }
            // ***** キー入力ありのとき *****
            if (input_buf.length > 0) {
                input_flag = false;
                num = input_buf.shift();
                return num;
            }
            // ***** キー入力なしのとき *****
            num = 0;
            if (repeat_flag) {
                input_flag = true;
                sleep_flag = true;
                sleep_time = 1000;
                return num;
            }
            if (a1 > 0 && !input_flag) {
                input_flag = true;
                sleep_flag = true;
                sleep_time = a1;
                return num;
            }
            input_flag = false;
            return num;
        });
        make_one_func_tbl("inputdlg", 1, [], function (param) {
            var num;
            var a1, a2, a3, a4;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = "";
            } else {
                a2 = String(param[1]);
                if (param.length <= 3) {
                    a3 = a4 = 0;
                } else {
                    a3 = Math.trunc(param[2]); // 未使用
                    a4 = Math.trunc(param[3]); // 未使用
                }
            }
            num = prompt(a1, a2) || ""; // nullのときは空文字列にする
            keyclear();
            mousebuttonclear();
            loop_nocount_flag1 = true;
            return num;
        });
        make_one_func_tbl("int", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.trunc(a1);
            return num;
        });
        make_one_func_tbl("join", 2, [0], function (param) {
            var num;
            var a1, a2, a3, a4;
            var i;

            a1 = get_var_obj(param[0]);
            a2 = String(param[1]);
            if (param.length <= 2) {
                a3 = 0;
                a4 = null;
            } else {
                a3 = Math.trunc(param[2]);
                if (param.length <= 3) {
                    a4 = null;
                } else {
                    a4 = Math.trunc(param[3]);
                }
            }

            // ***** NaN対策 *****
            a3 |= 0;

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
                if (a4 == null && !Vars.checkVar(a1, [i])) { break; }

                if (num == "") {
                    // num += vars[a1 + "[" + i + "]"];
                    num += Vars.getVarValue(a1, [i]);
                } else {
                    // num += a2 + vars[a1 + "[" + i + "]"];
                    num += a2 + Vars.getVarValue(a1, [i]);
                }
                i++;
            } while (a4 == null || i <= a4);
            return num;
        });
        make_one_func_tbl("keydowncode", -1, [], function (param) {
            var num;

            num = key_down_code;
            return num;
        });
        make_one_func_tbl("keyinput", 0, [], function (param) {
            var num;
            var a1;
            var repeat_flag;

            if (param.length <= 0) {
                a1 = 0;
                repeat_flag = true;
            } else {
                a1 = Math.trunc(param[0]);
                repeat_flag = false;
            }
            // ***** キー入力ありのとき *****
            if (keyinput_buf.length > 0) {
                keyinput_flag = false;
                num = keyinput_buf.shift();
                return num;
            }
            // ***** キー入力なしのとき *****
            num = 0;
            if (repeat_flag) {
                keyinput_flag = true;
                sleep_flag = true;
                sleep_time = 1000;
                return num;
            }
            if (a1 > 0 && !keyinput_flag) {
                keyinput_flag = true;
                sleep_flag = true;
                sleep_time = a1;
                return num;
            }
            keyinput_flag = false;
            return num;
        });
        make_one_func_tbl("keypresscode", -1, [], function (param) {
            var num;

            num = key_press_code;
            return num;
        });
        make_one_func_tbl("keyscan", 1, [], function (param) {
            var num;
            var a1;

            a1 = Math.trunc(param[0]);
            if (key_down_stat[a1]) { num = 1; } else { num = 0; }
            return num;
        });
        make_one_func_tbl("line", 4, [], function (param) {
            var a1, a2, a3, a4;

            a1 = (+param[0]); // X1
            a2 = (+param[1]); // Y1
            a3 = (+param[2]); // X2
            a4 = (+param[3]); // Y2
            ctx.beginPath();
            ctx.moveTo(a1, a2);
            ctx.lineTo(a3, a4);
            ctx.stroke();
            return nothing;
        });
        make_one_func_tbl("linewidth", 1, [], function (param) {
            var a1;

            a1 = (+param[0]); // W
            line_width = a1;
            ctx.lineWidth = line_width;
            return nothing;
        });
        make_one_func_tbl("load", 0, [], function (param) {
            var num;
            var a1;

            if (param.length <= 0) {
                a1 = 0;
            } else {
                a1 = Math.trunc(param[0]);
            }
            if (!save_data.hasOwnProperty(a1)) {
                num = "0";
            } else {
                num = save_data[a1];
            }
            // ***** 正負と小数と指数も含めた数値チェック(-1.23e4等) *****
            if (isFullDigit(num)) {
                num = +num; // 数値にする
            }
            return num;
        });
        make_one_func_tbl("loadimg", 2, [0], function (param) {
            var a1, a2;
            var i, j, k;
            var g_data = [];
            var col_num;
            var col_data = [];
            var trans_col_no;
            var col_no;
            var img_w, img_h;
            var img_data = {};

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = String(param[1]); // 画像データ文字列
            // ***** FlashCanvas用 *****
            if (!ctx.createImageData) { throw new Error("画像生成機能が利用できません。"); }
            // ***** 画像データの取得 *****
            g_data = a2.split(",");
            i = 0;
            col_num = Math.trunc(g_data[i++]);
            col_data = [];
            for (j = 0; j < col_num; j++) {
                col_data[j] = {};
                col_data[j].r = Math.trunc(g_data[i++]);
                col_data[j].g = Math.trunc(g_data[i++]);
                col_data[j].b = Math.trunc(g_data[i++]);
            }
            trans_col_no = Math.trunc(g_data[i++]);
            img_w = Math.trunc(g_data[i++]);
            img_h = Math.trunc(g_data[i++]);

            // ***** エラーチェック *****
            // if (img_w <= 0 || img_w > max_image_size || img_h <= 0 || img_h > max_image_size) {
            if (!(img_w > 0 && img_w <= max_image_size && img_h > 0 && img_h <= max_image_size)) {
                throw new Error("画像の縦横のサイズが不正です。1-" + max_image_size + "の間である必要があります。");
            }

            img_data = ctx.createImageData(img_w, img_h);
            k = 0;
            while (i < g_data.length) {
                col_no = Math.trunc(g_data[i++]);
                if ((col_no >=0 && col_no < col_num) && (col_no != trans_col_no)) {
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
            imgvars[a1].can = document.createElement("canvas");
            // ***** FlashCanvas Pro (将来用) で必要 *****
            if (typeof (FlashCanvas) != "undefined") {
                imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                document.getElementById("body1").appendChild(imgvars[a1].can);
                FlashCanvas.initElement(imgvars[a1].can);
            }
            imgvars[a1].can.width = img_w;
            imgvars[a1].can.height = img_h;
            imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
            // ***** Canvasの各種設定の初期化 *****
            init_canvas_setting(imgvars[a1].ctx);
            // ***** 画像を格納 *****
            imgvars[a1].ctx.putImageData(img_data, 0, 0);
            return nothing;
        });
        make_one_func_tbl("loadimgdata", 2, [0], function (param) {
            var a1, a2;
            var img_obj = {};

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = String(param[1]); // 画像データ文字列(data URI scheme)
            // ***** Canvasの生成 *****
            imgvars[a1] = {};
            imgvars[a1].can = document.createElement("canvas");
            // ***** FlashCanvas Pro (将来用) で必要 *****
            if (typeof (FlashCanvas) != "undefined") {
                imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                document.getElementById("body1").appendChild(imgvars[a1].can);
                FlashCanvas.initElement(imgvars[a1].can);
            }
            imgvars[a1].can.width = 16;
            imgvars[a1].can.height = 16;
            imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
            // ***** Canvasの各種設定の初期化 *****
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
                // ***** Canvasの各種設定の初期化 *****
                init_canvas_setting(imgvars[a1].ctx);
                // ***** 画像を描画 *****
                imgvars[a1].ctx.drawImage(img_obj, 0, 0);
                // alert(img_obj.complete);
                // ***** 完了フラグをセット *****
                imgvars[a1].loaded = true;
            };
            img_obj.src = a2; // 常にonloadより後にsrcをセットすること
            return nothing;
        });
        make_one_func_tbl("loadimgstat", 1, [0], function (param) {
            var num;
            var a1;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            // ***** 完了フラグをチェックして返す *****
            num = 0;
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                if (imgvars[a1].hasOwnProperty("loaded")) {
                    if (!imgvars[a1].loaded) {
                        num = 1;
                    }
                }
            }
            return num;
        });
        make_one_func_tbl("lock", 0, [], function (param) {
            // ***** NOP *****
            return nothing;
        });
        make_one_func_tbl("log", 1, [], function (param) {
            var num;
            var a1, a2;

            a1 = (+param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = (+param[1]);
            }
            if (a2 == 0) {
                num = Math.log(a1);
            } else {
                num = Math.log(a1) / Math.log(a2);
            }
            return num;
        });
        make_one_func_tbl("makearray", 2, [0], function (param) {
            var a1, a2, a3, a4;
            var i;

            a1 = get_var_obj(param[0]);
            a2 = Math.trunc(param[1]);
            if (param.length <= 2) {
                a3 = a2 - 1;
                a2 = 0;
                a4 = 0;
            } else {
                a3 = Math.trunc(param[2]);
                if (param.length <= 3) {
                    a4 = 0;
                } else {
                    a4 = param[3];
                }
            }

            // ***** エラーチェック *****
            // if (a3 - a2 + 1 < 1 || a3 - a2 + 1 > max_array_size) {
            if (!(a3 - a2 + 1 >= 1 && a3 - a2 + 1 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。1-" + max_array_size + "の間である必要があります。");
            }

            for (i = a2; i <= a3; i++) {
                // vars[a1 + "[" + i + "]"] = a4;
                Vars.setVarValue(a1, a4, [i]);
            }
            return nothing;
        });
        make_one_func_tbl("makeimg", 3, [0], function (param) {
            var a1, a2, a3;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // W
            a3 = Math.trunc(param[2]); // H

            // ***** エラーチェック *****
            // if (a2 <= 0 || a2 > max_image_size || a3 <= 0 || a3 > max_image_size) {
            if (!(a2 > 0 && a2 <= max_image_size && a3 > 0 && a3 <= max_image_size)) {
                throw new Error("画像の縦横のサイズが不正です。1-" + max_image_size + "の範囲で指定してください。");
            }

            // ***** Canvasの生成 *****
            imgvars[a1] = {};
            imgvars[a1].can = document.createElement("canvas");
            // ***** FlashCanvas Pro (将来用) で必要 *****
            if (typeof (FlashCanvas) != "undefined") {
                imgvars[a1].can.style.backgroundColor = can1_backcolor_init;
                document.getElementById("body1").appendChild(imgvars[a1].can);
                FlashCanvas.initElement(imgvars[a1].can);
            }
            imgvars[a1].can.width = a2;
            imgvars[a1].can.height = a3;
            imgvars[a1].ctx = imgvars[a1].can.getContext("2d");
            // ***** Canvasの各種設定の初期化 *****
            init_canvas_setting(imgvars[a1].ctx);
            return nothing;
        });
        make_one_func_tbl("max", 2, [], function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = (+param[0]);
            a2 = (+param[1]);
            num = Math.max(a1, a2);
            for (i = 2; i < param.length; i++) {
                a3 = (+param[i]);
                num = Math.max(num, a3);
            }
            return num;
        });
        make_one_func_tbl("millisecond", -1, [], function (param) {
            var num;

            num = new Date().getMilliseconds();
            return num;
        });
        make_one_func_tbl("min", 2, [], function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = (+param[0]);
            a2 = (+param[1]);
            num = Math.min(a1, a2);
            for (i = 2; i < param.length; i++) {
                a3 = (+param[i]);
                num = Math.min(num, a3);
            }
            return num;
        });
        make_one_func_tbl("minute", -1, [], function (param) {
            var num;

            num = new Date().getMinutes();
            return num;
        });
        make_one_func_tbl("month", -1, [], function (param) {
            var num;

            num = new Date().getMonth() + 1; // 1から12にするため1を加算
            return num;
        });
        make_one_func_tbl("mousex", -1, [], function (param) {
            var num;

            num = mousex;
            return num;
        });
        make_one_func_tbl("mousey", -1, [], function (param) {
            var num;

            num = mousey;
            return num;
        });
        make_one_func_tbl("mousebtn", -1, [], function (param) {
            var num;

            num = 0;
            if (mouse_btn_stat[0]) { num |= 1; }        // 左ボタン
            if (mouse_btn_stat[1]) { num |= (1 << 2); } // 中ボタン(シフト値1ではないので注意)
            if (mouse_btn_stat[2]) { num |= (1 << 1); } // 右ボタン(シフト値2ではないので注意)
            return num;
        });
        make_one_func_tbl("msgdlg", 1, [], function (param) {
            var a1;

            a1 = String(param[0]);
            if (param.length >= 2) {
                a1 = String(param[1]);
            }
            alert(a1);
            keyclear();
            mousebuttonclear();
            loop_nocount_flag1 = true;
            return nothing;
        });
        make_one_func_tbl("origin", 2, [], function (param) {
            var a1, a2;

            a1 = Math.trunc(param[0]); // X
            a2 = Math.trunc(param[1]); // Y
            // ***** 座標系の原点座標設定 *****
            axis.originx = a1;
            axis.originy = a2;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("oval", 6, [], function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var a, b, x0, y0;
            var rad1, rad2;
            var r1, c1;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            a5 = (+param[4]); // 開始角
            a6 = (+param[5]); // 描画角
            a = a3 / 2;  // X方向の半径
            b = a4 / 2;  // Y方向の半径
            x0 = a1 + a; // 中心のX座標
            y0 = a2 + b; // 中心のY座標
            rad1 = - a5 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
            rad2 = - a6 * Math.PI / 180; // PC上の角度は逆方向なのでマイナスを付ける
            ctx.beginPath();
            r1 = rad1;
            c1 = rad2 / 100;
            // ctx.moveTo(a * Math.cos(rad1) + x0, b * Math.sin(rad1) + y0);
            ctx.moveTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
            r1 += c1;
            for (i = 1; i <= 100; i++) {
                // ctx.lineTo(a * Math.cos(rad1 + rad2 * i / 100) + x0, b * Math.sin(rad1 + rad2 * i / 100) + y0);
                ctx.lineTo(a * Math.cos(r1) + x0, b * Math.sin(r1) + y0);
                r1 += c1;
            }
            ctx.stroke();
            // 以下は不要になったもよう(Chrome v27)
            // // ***** Chrome v23 で円が閉じない件の対策(中心を0.5ずらしたとき) *****
            // ctx.fillRect(a * Math.cos(rad1) + x0, b * Math.sin(rad1) + y0, 0.5, 0.5);
            return nothing;
        });
        make_one_func_tbl("PI", -1, [], function (param) {
            var num;

            num = Math.PI;
            return num;
        });
        make_one_func_tbl("point", 2, [], function (param) {
            var a1, a2;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            ctx.fillRect(a1, a2, 1, 1);
            return nothing;
        });
        make_one_func_tbl("pow", 2, [], function (param) {
            var num;
            var a1, a2;

            a1 = (+param[0]);
            a2 = (+param[1]);
            num = Math.pow(a1, a2);
            return num;
        });
        make_one_func_tbl("rand", -1, [], function (param) {
            var num;

            // min から max までの整数の乱数を返す
            // (Math.round() を用いると、非一様分布になるのでNG)
            // num = Math.floor(Math.random() * (max - min + 1)) + min;
            num = Math.floor(Math.random() * (2147483647 - (-2147483648) + 1)) + (-2147483648);
            return num;
        });
        make_one_func_tbl("random", -1, [], function (param) {
            var num;

            num = Math.random();
            return num;
        });
        make_one_func_tbl("rect", 4, [], function (param) {
            var a1, a2, a3, a4;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            ctx.beginPath();
            ctx.rect(a1, a2, a3, a4);
            ctx.stroke();
            return nothing;
        });
        make_one_func_tbl("replace", 3, [], function (param) {
            var num;
            var a1, a2, a3, a4, a5;
            var i, j, k;

            a1 = String(param[0]);
            a2 = String(param[1]);
            a3 = String(param[2]);
            if (param.length <= 3) {
                a4 = 0;
                a5 = -1;
            } else {
                a4 = Math.trunc(param[3]);
                if (param.length <= 4) {
                    a5 = -1;
                } else {
                    a5 = Math.trunc(param[4]);
                }
            }
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
                        num += a1.substring(j, k) + a3;
                        i++;
                        j = k + a2.length;
                    }
                }
                num += a1.substring(j);
            }
            return num;
        });
        make_one_func_tbl("rotate", 1, [], function (param) {
            var a1, a2, a3;

            a1 = (+param[0]); // 角度
            if (param.length <= 2) {
                a2 = 0;
                a3 = 0;
            } else {
                a2 = (+param[1]); // 中心座標X
                a3 = (+param[2]); // 中心座標Y
            }
            // ***** 座標系の角度設定 *****
            axis.rotate = a1 * Math.PI / 180;
            axis.rotateox = a2;
            axis.rotateoy = a3;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("round", 6, [], function (param) {
            var a1, a2, a3, a4, a5, a6;
            var rx, ry;

            a1 = (+param[0]); // X
            a2 = (+param[1]); // Y
            a3 = (+param[2]); // W
            a4 = (+param[3]); // H
            a5 = (+param[4]); // RX
            a6 = (+param[5]); // RY
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
            // ctx.rotate(45 * Math.PI / 180);     // 回転させるとなぜか描画する
            ctx.stroke();
            // 以下は不要になったもよう(Chrome v27)
            // ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            // set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("save", 1, [], function (param) {
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = Math.trunc(param[0]);
            }
            save_data[a2] = a1;
            return nothing;
        });
        make_one_func_tbl("scale", 1, [], function (param) {
            var a1, a2, a3, a4;

            a1 = (+param[0]); // X方向倍率
            if (param.length <= 1) {
                a2 = a1;
                a3 = 0;
                a4 = 0;
            } else {
                a2 = (+param[1]); // Y方向倍率
                if (param.length <= 3) {
                    a3 = 0;
                    a4 = 0;
                } else {
                    a3 = (+param[2]); // 中心座標X
                    a4 = (+param[3]); // 中心座標Y
                }
            }

            // ***** エラーチェック *****
            // if (a1 < -max_scale_size || a1 > max_scale_size || a2 < -max_scale_size || a2 > max_scale_size) {
            if (!(a1 >= -max_scale_size && a1 <= max_scale_size && a2 >= -max_scale_size && a2 <= max_scale_size)) {
                throw new Error("座標系の倍率の値が不正です。-" + max_scale_size + "から" + max_scale_size + "までの数値を指定してください。");
            }

            // ***** 座標系の倍率設定 *****
            axis.scalex = a1;
            axis.scaley = a2;
            axis.scaleox = a3;
            axis.scaleoy = a4;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 座標系を元に戻す
            set_canvas_axis(ctx);               // 座標系を再設定
            return nothing;
        });
        make_one_func_tbl("scan", -1, [], function (param) {
            var num;

            num = key_scan_stat;
            return num;
        });
        make_one_func_tbl("second", -1, [], function (param) {
            var num;

            num = new Date().getSeconds();
            return num;
        });
        make_one_func_tbl("setfont", 1, [], function (param) {
            var a1;

            a1 = String(param[0]).toUpperCase();
            switch (a1) {
                case "L": font_size = font_size_set[3]; break;
                case "M": font_size = font_size_set[2]; break;
                case "S": font_size = font_size_set[1]; break;
                case "T": font_size = font_size_set[0]; break;
                default:  font_size = font_size_set[1]; // break;
            }
            ctx.font = font_size + "px " + font_family;
            return nothing;
        });
        make_one_func_tbl("setfontsize", 1, [], function (param) {
            var a1;

            a1 = Math.trunc(param[0]);

            // ***** エラーチェック *****
            // if (a1 <= 0 || a1 > max_font_size) {
            if (!(a1 > 0 && a1 <= max_font_size)) {
                throw new Error("フォントサイズが不正です。1-" + max_font_size + "の範囲で指定してください。");
            }

            font_size = a1;
            ctx.font = font_size + "px " + font_family;
            return nothing;
        });
        make_one_func_tbl("setoutdata", 2, [], function (param) {
            var a1, a2;

            a1 = Math.trunc(param[0]);
            a2 = String(param[1]);
            out_data[a1] = a2;
            return nothing;
        });
        make_one_func_tbl("setpixel", 3, [], function (param) {
            var a1, a2, a3;
            var col_r, col_g, col_b;

            a1 = (+param[0]);   // X
            a2 = (+param[1]);   // Y
            a3 = Math.trunc(param[2]); // RGB
            col_r = (a3 & 0xff0000) >> 16; // R
            col_g = (a3 & 0x00ff00) >> 8;  // G
            col_b = (a3 & 0x0000ff);       // B
            ctx.fillStyle = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
            ctx.fillRect(a1, a2, 1, 1);
            ctx.fillStyle = color_val;
            return nothing;
        });
        make_one_func_tbl("setscl", 1, [], function (param) {
            var num;
            var a1, a2, a3;

            a1 = (+param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = (+param[1]);
            }
            a3 = Math.pow(10, a2);
            num = Math.round(a1 * a3) / a3;
            return num;
        });
        make_one_func_tbl("setscsize", 2, [], function (param) {
            var a1, a2, a3, a4;

            a1 = Math.trunc(param[0]); // W
            a2 = Math.trunc(param[1]); // H
            if (param.length <= 3) {
                a3 = a1;
                a4 = a2;
            } else {
                a3 = Math.trunc(param[2]); // W2
                a4 = Math.trunc(param[3]); // H2
            }

            // ***** エラーチェック *****
            // if (a1 <= 0 || a1 > max_image_size || a2 <= 0 || a2 > max_image_size ||
            //     a3 <= 0 || a3 > max_image_size || a4 <= 0 || a4 > max_image_size) {
            if (!(a1 > 0 && a1 <= max_image_size && a2 > 0 && a2 <= max_image_size &&
                  a3 > 0 && a3 <= max_image_size && a4 > 0 && a4 <= max_image_size)) {
                throw new Error("縦横のサイズの値が不正です。1-" + max_image_size + "の範囲で指定してください。");
            }

            // ***** 画面サイズ設定 *****
            can1.width = a1;
            can1.height = a2;
            can1.style.width = a3 + "px";
            can1.style.height = a4 + "px";
            // ***** ソフトキー表示 *****
            if (a3 > can2_width_init) {
                can2.width = a3;
                can2.style.width = a3 + "px";
            } else {
                can2.width = can2_width_init;
                can2.style.width = can2_width_init + "px";
            }
            disp_softkeys();
            // ***** Canvasの各種設定のリセット *****
            reset_canvas_setting(ctx1);
            return nothing;
        });
        make_one_func_tbl("sign", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if      (a1 > 0) { num =  1; }
            else if (a1 < 0) { num = -1; }
            else             { num =  0; }
            return num;
        });
        make_one_func_tbl("sin", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if (sp_compati_flag) {
                num = Math.trunc(Math.sin(a1 * Math.PI / 180) * 100);
            } else {
                num = Math.sin(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl("sleep", 1, [], function (param) {
            var a1;

            a1 = Math.trunc(param[0]);
            sleep_flag = true;
            sleep_time = a1;
            return nothing;
        });
        make_one_func_tbl("sleepsync", 1, [], function (param) {
            var a1, a2;
            var t_new;
            var t_diff;

            a1 = Math.trunc(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = Math.trunc(param[1]);
            }
            t_new = Date.now();
            if (sleep_data.hasOwnProperty(a2)) {
                t_diff = t_new - sleep_data[a2];
                if (t_diff >= -a1 && t_diff < a1) {
                    sleep_time = a1 - t_diff;
                } else if (t_diff >= a1 && t_diff < a1 * 50) {
                    sleep_time = 1;
                } else {
                    sleep_time = a1;
                }
            } else {
                sleep_time = a1;
            }
            sleep_data[a2] = t_new + sleep_time;
            sleep_flag = true;
            return nothing;
        });
        make_one_func_tbl("soft1", 1, [], function (param) {
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = can2_font_size_init;
            } else {
                a2 = Math.trunc(param[1]);
            }

            // ***** エラーチェック *****
            // if (a2 <= 0 || a2 > max_font_size2) {
            if (!(a2 > 0 && a2 <= max_font_size2)) {
                throw new Error("フォントサイズが不正です。1-" + max_font_size2 + "の範囲で指定してください。");
            }

            // ***** ソフトキー表示 *****
            softkeys[0].text = a1;
            softkeys[0].font_size = a2;
            disp_softkeys();
            return nothing;
        });
        make_one_func_tbl("soft2", 1, [], function (param) {
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = can2_font_size_init;
            } else {
                a2 = Math.trunc(param[1]);
            }

            // ***** エラーチェック *****
            // if (a2 <= 0 || a2 > max_font_size2) {
            if (!(a2 > 0 && a2 <= max_font_size2)) {
                throw new Error("フォントサイズが不正です。1-" + max_font_size2 + "の範囲で指定してください。");
            }

            // ***** ソフトキー表示 *****
            softkeys[1].text = a1;
            softkeys[1].font_size = a2;
            disp_softkeys();
            return nothing;
        });
        make_one_func_tbl("split", 3, [0], function (param) {
            var num;
            var a1, a2, a3, a4;
            var i, j, k;

            a1 = get_var_obj(param[0]);
            a2 = String(param[1]);
            a3 = String(param[2]);
            if (param.length <= 3) {
                a4 = 0;
            } else {
                a4 = Math.trunc(param[3]);
            }
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
                        Vars.setVarValue(a1, a2.substring(j, k), [i]);
                        i++;
                        j = k + 1;
                    }
                }
                // vars[a1 + "[" + i + "]"] = a2.substring(j);
                Vars.setVarValue(a1, a2.substring(j), [i]);
                num = i + 1;
            }
            return num;
        });
        make_one_func_tbl("sptype", -1, [], function (param) {
            var num;

            num = "spweb";
            return num;
        });
        make_one_func_tbl("sqrt", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            num = Math.sqrt(a1);
            return num;
        });
        make_one_func_tbl("sthigh", -1, [], function (param) {
            var num;

            num = font_size;
            return num;
        });
        make_one_func_tbl("strat", 2, [], function (param) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            a2 = Math.trunc(param[1]);
            num = a1.charAt(a2);
            return num;
        });
        make_one_func_tbl("strlen", 1, [], function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.length;
            return num;
        });
        make_one_func_tbl("stwide", 1, [], function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = ctx.measureText(a1).width;
            return num;
        });
        make_one_func_tbl("substr", 2, [], function (param) {
            var num;
            var a1, a2, a3;

            a1 = String(param[0]);
            a2 = Math.trunc(param[1]);
            if (param.length <= 2) {
                a3 = a1.length;
            } else {
                a3 = Math.trunc(param[2]);
            }
            num = a1.substr(a2, a3);
            return num;
        });
        make_one_func_tbl("tan", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if (sp_compati_flag) {
                num = Math.trunc(Math.tan(a1 * Math.PI / 180) * 100);
            } else {
                num = Math.tan(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl("text", 1, [], function (param) {
            var a1, a2, a3, a4;

            // ***** 文字列に変換 *****
            // a1 = param[0];
            a1 = String(param[0]);

            // ***** Chrome v24 で全角スペースが半角のサイズで表示される件の対策 *****
            a1 = a1.replace(/　/g, "  "); // 全角スペースを半角スペース2個に変換

            if (param.length >= 4) {
                a2 = Math.trunc(param[1]); // X
                a3 = Math.trunc(param[2]); // Y
                a4 = Math.trunc(param[3]); // アンカー
            } else if (param.length == 3) {
                a2 = Math.trunc(param[1]); // X
                a3 = Math.trunc(param[2]); // Y
                a4 = 0;
            } else if (param.length == 2) {
                a2 = Math.trunc(param[1]); // X
                a3 = a4 = 0;
            } else {
                a2 = a3 = a4 = 0;
            }
            // ***** 水平方向 *****
            // if (a4 & 4)    { ctx.textAlign = "left"; }   // 左
            if (a4 & 8)       { ctx.textAlign = "right"; }  // 右
            else if (a4 & 1)  { ctx.textAlign = "center"; } // 中央
            else { ctx.textAlign = "left"; }                // その他
            // ***** 垂直方向 *****
            // if (a4 & 16)   { ctx.textBaseline = "top"; }        // 上
            if (a4 & 32)      { ctx.textBaseline = "bottom"; }     // 下
            else if (a4 & 2)  { ctx.textBaseline = "middle"; }     // 中央
            else if (a4 & 64) { ctx.textBaseline = "alphabetic"; } // ベースライン
            else { ctx.textBaseline = "top"; }                     // その他
            // ***** 文字列表示 *****
            ctx.fillText(a1, a2, a3);
            return nothing;
        });
        make_one_func_tbl("tick", -1, [], function (param) {
            var num;

            // num = new Date().getTime();
            num = Date.now();
            return num;
        });
        make_one_func_tbl("trgt", 1, [0], function (param) {
            var a1;

            a1 = to_global(get_var_obj(param[0])); // 画像変数名取得
            if (a1 == "off") {
                can = can1;
                ctx = ctx1;
            // } else if (imgvars.hasOwnProperty(a1)) {
            } else if (hasOwn.call(imgvars, a1)) {
                can = imgvars[a1].can;
                ctx = imgvars[a1].ctx;
            } else {
                throw new Error("Image「" + a1 + "」がロードされていません。");
            }
            // ***** Canvasの各種設定のリセット *****
            reset_canvas_setting(ctx);
            return nothing;
        });
        make_one_func_tbl("trim", 1, [], function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.replace(/^\s+|\s+$/g, "");
            return num;
        });
        make_one_func_tbl("unlock", 0, [], function (param) {
            var a1;

            if (param.length <= 0) {
                a1 = 0;
            } else {
                a1 = Math.trunc(param[0]);
            }
            // ***** NOP *****
            return nothing;
        });
        make_one_func_tbl("week", -1, [], function (param) {
            var num;

            num = new Date().getDay() + 1; // =1:日曜日,=2:月曜日 ... =7:土曜日
            return num;
        });
        make_one_func_tbl("width", -1, [], function (param) {
            var num;

            num = can1.width;
            return num;
        });
        make_one_func_tbl("year", -1, [], function (param) {
            var num;

            num = new Date().getFullYear();
            return num;
        });
        make_one_func_tbl("yndlg", 1, [], function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            if (param.length >= 2) {
                a1 = String(param[1]);
            }
            if (confirm(a1)) { num = "YES"; } else { num = "NO"; }
            keyclear();
            mousebuttonclear();
            loop_nocount_flag1 = true;
            return num;
        });
        make_one_func_tbl("@", 1, [0], function (param) {
            var a1, a2;
            var i;

            a1 = get_var_obj(param[0]);
            for (i = 1; i < param.length; i++) {
                a2 = param[i];
                // vars[a1 + "[" + (i - 1) + "]"] = a2;
                Vars.setVarValue(a1, a2, [i - 1]);
            }
            return nothing;
        });
    }

    // ***** 組み込み関数の定義情報1個の生成 *****
    function make_one_func_tbl(name, param_num, param_varname_indexes, func) {
        var i;

        // (定義情報1個の生成)
        func_tbl[name] = {};
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        // (これを-1にすると組み込み変数になり、()なしで呼び出せる)
        func_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        func_tbl[name].param_varname_flag = {};
        if (param_varname_indexes && param_varname_indexes.length) {
            for (i = 0; i < param_varname_indexes.length; i++) {
                func_tbl[name].param_varname_flag[param_varname_indexes[i]] = true;
            }
        }
        // (関数の本体を設定)
        func_tbl[name].func = func;
    }

    // ****************************************
    //            追加命令の定義処理
    // ****************************************

    // ***** 追加の組み込み関数の定義情報1個の生成 *****
    function add_one_func_tbl(name, param_num, param_varname_indexes, func) {
        var i;

        // (定義情報1個の生成)
        addfunc_tbl[name] = {};
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        // (これを-1にすると組み込み変数になり、()なしで呼び出せる)
        addfunc_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        addfunc_tbl[name].param_varname_flag = {};
        if (param_varname_indexes && param_varname_indexes.length) {
            for (i = 0; i < param_varname_indexes.length; i++) {
                addfunc_tbl[name].param_varname_flag[param_varname_indexes[i]] = true;
            }
        }
        // (関数の本体を設定)
        addfunc_tbl[name].func = func;
    }

    // ***** プラグイン用 *****
    // (必要に応じてインタープリターの内部情報を公開する)
    Interpreter.add_before_run_funcs = function (name, func) { before_run_funcs[name] = func; };
    Interpreter.add_after_run_funcs = function (name, func) { after_run_funcs[name] = func; };
    Interpreter.add_clear_var_funcs = function (name, func) { clear_var_funcs[name] = func; };
    Interpreter.add_one_func_tbl = add_one_func_tbl;
    Interpreter.Vars = Vars;
    Interpreter.get_var_obj = get_var_obj;
    Interpreter.to_global = to_global;
    Interpreter.set_canvas_axis = set_canvas_axis;
    Interpreter.conv_axis_point = conv_axis_point;
    Interpreter.max_array_size = max_array_size;
    Interpreter.max_str_size = max_str_size;
    Interpreter.get_can = function () { return can; };
    Interpreter.get_ctx = function () { return ctx; };
    Interpreter.get_imgvars = function () { return imgvars; };
    Interpreter.get_font_size = function () { return font_size; };
    Interpreter.set_color_val = function (v) { color_val = v; };
    Interpreter.set_loop_nocount = function () { loop_nocount_flag1 = true; };


})(Interpreter || (Interpreter = {}));


// ***** 以下は外部クラス *****


// ***** ファイルダウンロード用クラス(staticクラス) *****
var Download = (function () {
    // ***** コンストラクタ *****
    // ***** (staticクラスのため未使用) *****
    function Download() { }

    // ***** Blobオブジェクトの取得 *****
    var Blob = window.Blob;
    // ***** Blobセーブ用オブジェクトの取得(IE10用) *****
    // (window.saveBlobではないので、呼び出し時にはcallを用いて、
    //   saveBlob.call(navigator, blob, fname) とする必要がある)
    var saveBlob = null;
    if (window.navigator) {
        saveBlob = navigator.saveBlob || navigator.msSaveBlob;
    }
    // ***** URLオブジェクトの取得 *****
    var URL = window.URL || window.webkitURL;

    // ***** ファイルをダウンロードする(staticメソッド) *****
    Download.download = function (data, fname) {
        var url;
        var blob;
        var elm, ev;
        var link_download_flag;

        // ***** 引数のチェック *****
        if (data == null) { return false; }
        if (!fname) { fname = "download"; }
        // ***** リンク要素の生成 *****
        elm = document.createElement("a");
        // ***** リンク要素でダウンロード可能か(Chrome用) *****
        if ((elm.download || elm.download == "") && document.createEvent && elm.dispatchEvent) {
            link_download_flag = true;
        } else {
            link_download_flag = false;
        }
        // ***** Blobの生成 *****
        if (Blob && (saveBlob || link_download_flag)) {
            blob = new Blob([data], {type : "application/octet-stream"});
        } else {
            blob = null;
        }
        // ***** Blobをセーブ(IE10用) *****
        if (blob && saveBlob) {
            // saveBlob(blob, fname);
            saveBlob.call(navigator, blob, fname);
            return true;
        }
        // ***** urlの生成 *****
        if (blob && URL && URL.createObjectURL) {
            url = URL.createObjectURL(blob);
        } else {
            url = "data:application/octet-stream," + encodeURIComponent(data);
        }
        // ***** リンク要素でダウンロード(Chrome用) *****
        if (link_download_flag) {
            elm.href = url;
            elm.download = fname;
            ev = document.createEvent("MouseEvents");
            ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            elm.dispatchEvent(ev);
            return true;
        }
        // ***** それ以外のときはURLにジャンプ(ファイル名は指定不可) *****
        window.location.href = url;
        return true;
    };
    // ***** Canvasの画像をダウンロードする(staticメソッド) *****
    Download.downloadCanvas = function (can, fname) {
        var url;
        var blob;
        var elm, ev;
        var link_download_flag;
        var i;
        var data_url;
        var bin_st;     // バイナリデータ文字列
        var bin_st_len; // バイナリデータ文字列の長さ
        var uint8_arr;  // バイナリデータ(型付配列)

        // ***** 引数のチェック *****
        if (!can) { return false; }
        if (!fname) { fname = "download.png"; }
        // ***** リンク要素の生成 *****
        elm = document.createElement("a");
        // ***** リンク要素でダウンロード可能か(Chrome用) *****
        if ((elm.download || elm.download == "") && document.createEvent && elm.dispatchEvent) {
            link_download_flag = true;
        } else {
            link_download_flag = false;
        }
        // ***** Blobの生成 *****
        if (Blob && Uint8Array && (saveBlob || link_download_flag)) {
            data_url = can.toDataURL("image/png");
            bin_st = atob(data_url.split(",")[1]);
            bin_st_len = bin_st.length;
            uint8_arr = new Uint8Array(bin_st_len);
            for (i = 0; i < bin_st_len; i++) {
                uint8_arr[i] = bin_st.charCodeAt(i);
            }
            blob = new Blob([uint8_arr.buffer], {type : "image/octet-stream"});
        } else {
            blob = null;
        }
        // ***** Blobをセーブ(IE10用) *****
        if (blob && saveBlob) {
            // saveBlob(blob, fname);
            saveBlob.call(navigator, blob, fname);
            return true;
        }
        // ***** urlの生成 *****
        if (blob && URL && URL.createObjectURL) {
            url = URL.createObjectURL(blob);
        } else {
            url = can.toDataURL("image/png").replace("image/png", "image/octet-stream");
        }
        // ***** リンク要素でダウンロード(Chrome用) *****
        if (link_download_flag) {
            elm.href = url;
            elm.download = fname;
            ev = document.createEvent("MouseEvents");
            ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            elm.dispatchEvent(ev);
            return true;
        }
        // ***** それ以外のときはURLにジャンプ(ファイル名は指定不可) *****
        window.location.href = url;
        return true;
    };
    return Download; // これがないとクラスが動かないので注意
})();


// ***** プロファイラ用クラス *****
var Profiler = (function () {
    // ***** コンストラクタ *****
    function Profiler() {
        this.time_obj = {};        // 時間測定オブジェクト(キー名称ごと)
        this.time_start = {};      // 測定開始時間        (キー名称ごと)
        this.time_start_flag = {}; // 時間測定開始フラグ  (キー名称ごと)
        this.records = {};         // 測定結果            (キー名称ごと)
    }

    // ***** 定数 *****
    // (Chrome を --enable-benchmarking オプション付きで起動したときは、
    //  マイクロ秒まで測定する)
    if (typeof (chrome) != "undefined" && typeof (chrome.Interval) == "function") {
        Profiler.MicroSecAvailable = true;
    } else {
        Profiler.MicroSecAvailable = false;
    }

    // ***** hasOwnPropertyをプロパティ名に使うかもしれない場合の対策 *****
    // (obj.hasOwnProperty(prop) を hasOwn.call(obj, prop) に置換した)
    var hasOwn = Object.prototype.hasOwnProperty;

    // ***** 時間測定高速化用 *****
    // (new Date().getTime() より Date.now() の方が高速だが、
    //  Date.now() が存在しないブラウザもあるのでその対策)
    if (!Date.now) { Date.now = function () { return new Date().getTime(); }; }

    // ***** 時間測定開始 *****
    // (キー名称ごとに測定結果を別にする)
    Profiler.prototype.start = function (key_name) {
        // if (!this.records.hasOwnProperty(key_name)) { this.records[key_name] = []; }
        if (!hasOwn.call(this.records, key_name)) { this.records[key_name] = []; }
        this.time_start_flag[key_name] = true;
        if (Profiler.MicroSecAvailable) {
            // if (!this.time_obj.hasOwnProperty(key_name)) { this.time_obj[key_name] = new chrome.Interval(); }
            if (!hasOwn.call(this.time_obj, key_name)) { this.time_obj[key_name] = new chrome.Interval(); }
            this.time_obj[key_name].start();
        } else {
            // this.time_start[key_name] = new Date().getTime();
            this.time_start[key_name] = Date.now();
        }
    };
    // ***** 時間測定終了 *****
    // (キー名称ごとに測定結果を別にする)
    Profiler.prototype.stop = function (key_name) {
        // if (!this.records.hasOwnProperty(key_name)) { return false; }
        if (!hasOwn.call(this.records, key_name)) { return false; }
        if (!this.time_start_flag[key_name]) { return false; }
        if (Profiler.MicroSecAvailable) {
            this.time_obj[key_name].stop();
            this.records[key_name].push(this.time_obj[key_name].microseconds() / 1000);
        } else {
            // this.records[key_name].push(new Date().getTime() - this.time_start[key_name]);
            this.records[key_name].push(Date.now() - this.time_start[key_name]);
        }
        this.time_start_flag[key_name] = false;
    };
    // ***** 結果取得 *****
    // (キー名称に対応する測定結果を、文字列にして返す)
    // (測定結果の項目は、実行回数(回)、合計時間(msec)、平均時間(msec)、最大時間(msec)、最小時間(msec))
    Profiler.prototype.getResult = function (key_name) {
        var i;
        var ret;
        var rec, time_total, time_mean, time_max, time_min;
        ret = "";
        // if (this.records.hasOwnProperty(key_name)) {
        if (hasOwn.call(this.records, key_name)) {
            rec = this.records[key_name];
            time_total = 0;
            time_mean = 0;
            time_max = 0;
            time_min = 0;
            for (i = 0; i < rec.length; i++) {
                time_total += rec[i];
                if (i == 0) { time_max = rec[i]; time_min = rec[i]; }
                if (time_max < rec[i]) { time_max = rec[i]; }
                if (time_min > rec[i]) { time_min = rec[i]; }
            }
            if (rec.length > 0) { time_mean = time_total / rec.length; }
            time_total = Math.round(time_total * 1000) / 1000;
            time_mean = Math.round(time_mean * 1000) / 1000;
            time_max = Math.round(time_max * 1000) / 1000;
            time_min = Math.round(time_min * 1000) / 1000;
            ret = key_name + ": count=" + rec.length +
                " total="     + time_total + "(msec) mean=" + time_mean +
                "(msec) max=" + time_max   + "(msec) min="  + time_min  + "(msec)";
        }
        return ret;
    };
    // ***** 全結果取得 *****
    // (全キー名称の測定結果を、複数行の文字列にして返す)
    Profiler.prototype.getAllResult = function () {
        var ret;
        var key_name;
        ret = "";
        for (key_name in this.records) {
            // if (this.records.hasOwnProperty(key_name)) {
            if (hasOwn.call(this.records, key_name)) {
                ret += this.getResult(key_name) + "\n";
            }
        }
        return ret;
    };
    return Profiler; // これがないとクラスが動かないので注意
})();


