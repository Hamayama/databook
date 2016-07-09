// -*- coding: utf-8 -*-

// sp_interpreter.js
// 2016-7-9 v4.00


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
function init_func() {
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
        if (i < list_st_len) { ch2 = list_st.charAt(i); } else { ch2 = ""; }
        // ***** 空白かTABのとき *****
        if (ch == " " || ch == "\t") { split_flag = true; }
        // ***** 改行のとき *****
        if (ch == "\r" && ch2 == "\n") { i++; split_flag = true; }
        else if (ch == "\r" || ch == "\n") { split_flag = true; }
        // ***** コメント「;」のとき *****
        if (ch == ";") {
            while (i < list_st_len) {
                // ***** 1文字取り出す *****
                ch = list_st.charAt(i++);
                if (i < list_st_len) { ch2 = list_st.charAt(i); } else { ch2 = ""; }
                // ***** 改行のとき *****
                if (ch == "\r" && ch2 == "\n") { i++; break; }
                else if (ch == "\r" || ch == "\n") { break; }
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

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (fname == null) { Alm("load_listfile:0001"); return ret; }
    if (fname == "") { Alm("load_listfile:0002"); return ret; }
    if (error_show_flag == null) { Alm("load_listfile:0003"); return ret; }
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
            if (check_id(prog_id[i], 8)) {
                elm.length++;
                elm.options[elm.length - 1].value = prog_id[i];
                elm.options[elm.length - 1].text  = prog_id[i];
            }
        }
    }, function (err_st) {
        if (error_show_flag) { Alm2("load_listfile:" + err_st + ":リストファイル読み込みエラー"); }
    });
    // ***** 戻り値を返す *****
    ret = true;
    return ret;
}

// ***** ソースファイルの読み込み *****
function load_srcfile(fname, auto_run_flag) {
    var ret;

    // ***** 戻り値の初期化 *****
    ret = false;
    // ***** 引数のチェック *****
    if (fname == null) { Alm("load_srcfile:0001"); return ret; }
    if (fname == "") { Alm("load_srcfile:0002"); return ret; }
    if (auto_run_flag == null) { Alm("load_srcfile:0003"); return ret; }
    // ***** 要素の存在チェック *****
    if (!document.getElementById("src_text1")) { Alm("load_srcfile:0004"); return ret; }
    // ***** ロード中にする *****
    Interpreter.setloadstat(true);
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
        // ***** 自動実行 *****
        if (auto_run_flag) { run_button(); }
    }, function (err_st) {
        Alm2("load_srcfile:" + err_st + ":ソースファイル読み込みエラー");
        // ***** ロード中を解除 *****
        Interpreter.setloadstat(false);
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
//             インタープリター
// ****************************************

// ***** Interpreter(名前空間) *****
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
//   Interpreter.setoutdata(no, data)  外部データ設定
//   Interpreter.getoutdata(no)        外部データ取得
//
// その他 情報等 :
//
//   各命令の定義は make_func_tbl の中で行っています。
//   また、新しい命令の追加は、別ファイルのプラグインで行うことを想定しています。
//
//   内部クラス一覧
//     Vars        変数用クラス
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
    var token_len = 0;          // トークン数        (token.lengthのキャッシュ用)
    var code = [];              // コード            (配列)
    var code_info = [];         // コード情報        (配列)(エラー表示用)
    var code_str = [];          // コード文字列      (配列)(表示用とラベル設定用)
    var code_len = 0;           // コード数          (code.lengthのキャッシュ用)
    var vars = {};              // 変数用            (Varsクラスのインスタンス)
    var imgvars = {};           // 画像変数用        (連想配列オブジェクト)
    var label = {};             // ラベル用          (連想配列オブジェクト)
    var func = {};              // 関数用            (連想配列オブジェクト)
    var stack = [];             // スタック          (配列)
    var param = [];             // 関数の引数        (配列)
    var nothing = 0;            // 戻り値なしの組み込み関数の戻り値

    var pc;                     // プログラムカウンタ
    var debugpc;                // エラーの場所
    var end_flag;               // 終了フラグ
    var running_flag = false;   // 実行中フラグ
    var loading_flag = false;   // ロード中フラグ
    var debug_mode = 0;         // デバッグモード(=0:通常モード,=1:デバッグモード)
    var debugpos1;              // デバッグ位置1
    var debugpos2;              // デバッグ位置2
    var sleep_flag;             // スリープ用のフラグ
    var sleep_time;             // スリープ時間(msec)
    var sleep_id = null;        // スリープキャンセル用ID
    var sleep_data = {};        // スリープ時間調整用(連想配列オブジェクト)
    var loop_time_max = 3000;   // 最大ループ時間(msec)(これ以上時間がかかったらエラーとする)
    var loop_time_start;        // ループ開始時間(msec)
    var loop_time_count;        // ループ経過時間(msec)
    var loop_nocount_flag;      // ループ時間ノーカウントフラグ
    var loop_nocount_mode;      // ループ時間ノーカウントモード
    var input_flag;             // キー入力待ちフラグ1(携帯互換用)
    var keyinput_flag;          // キー入力待ちフラグ2(PC用)
    var funccall_stack = [];    // 関数呼び出し情報保存用(配列)
    var gosub_back = [];        // gosubの戻り先(配列)

    var key_press_code;         // キープレスコード
    var key_down_code;          // キーダウンコード
    var key_down_stat = {};     // キーダウン状態(キーごと)(連想配列オブジェクト)
    var key_scan_stat;          // キースキャン状態(携帯互換用)
    var input_buf = [];         // キー入力バッファ1(携帯互換用)(配列)
    var keyinput_buf = [];      // キー入力バッファ2(PC用)      (配列)
    var softkey = [];           // ソフトキー表示               (配列)

    var mousex;                 // マウスX座標(px)
    var mousey;                 // マウスY座標(px)
    var mouse_btn_stat = {};    // マウスボタン状態(ボタンごと)(連想配列オブジェクト)

    var sp_compati_mode;        // 互換モード(=0:通常モード,=1:互換モード)
    var use_local_vars;         // ローカル変数使用有無
    var save_data = {};         // セーブデータ(連想配列オブジェクト)(仮)
    var prof_obj = {};          // プロファイラ実行用(Profilerクラスのインスタンス)
    var out_data = {};          // 外部データ(連想配列オブジェクト)

    var func_tbl = {};          // 組み込み関数の定義情報(連想配列オブジェクト)
    var addfunc_tbl = {};       // 追加の組み込み関数の定義情報(連想配列オブジェクト)

    var before_run_funcs = {};  // プラグイン用の実行前処理(連想配列オブジェクト)
    var after_run_funcs = {};   // プラグイン用の実行後処理(連想配列オブジェクト)
    var clear_var_funcs = {};   // プラグイン用の全変数クリア時処理(連想配列オブジェクト)

    var const_tbl = {};         // 定数の定義情報(連想配列オブジェクト)

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
        37:(1 << 13), // 12でないので注意
        38:(1 << 12), // 13でないので注意
        39:(1 << 14),
        40:(1 << 15),
        // 決定ボタン は スペースキーとEnterキーとCtrlキーにする
        32:(1 << 16), 13:(1 << 16), 17:(1 << 16),
        // [Soft1][Soft2] は [c][v]にする
        67:(1 << 17), 86:(1 << 18) };

    var opecode = {             // スタックマシンの命令コード
        load:1,         pointer:2,      array:3,        store:4,        storenum:5,
        storestr:6,     store0:7,       store1:8,       preinc:9,       predec:10,
        postinc:11,     postdec:12,     loadadd:13,     loadsub:14,     loadmul:15,
        loaddiv:16,     loaddivint:17,  loadmod:18,     loadaddstr:19,  add:20,
        addstr:21,      sub:22,         mul:23,         div:24,         divint:25,
        mod:26,         shl:27,         shr:28,         ushr:29,        positive:30,
        negative:31,    and:32,         or:33,          xor:34,         not:35,
        lognot:36,      cmpeq:37,       cmpne:38,       cmplt:39,       cmple:40,
        cmpgt:41,       cmpge:42,       label:43,       "goto":44,      ifgoto:45,
        ifnotgoto:46,   gotostack:47,   gosubstack:48,  "return":49,    func:50,
        funcend:51,     call:52,        callwait:53,    calladdfunc:54, calluser:55,
        gotouser:56,    loadparam:57,   pop:58,         dup:59,         end:60 };

    var reserved = {            // 予約名
        "label":1,      "goto":2,       "gosub":3,      "return":4,     "end":5,
        "func":6,       "funcgoto":7,   "break":8,      "continue":9,   "switch":10,
        "case":11,      "default":12,   "if":13,        "elsif":14,     "else":15,
        "for":16,       "while":17,     "do":18,        "global":19,    "glb":20,
        "local":21,     "loc":22,       "defconst":23,  "disconst":24 };

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
        // ***** 命令の定義情報の生成 *****
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
        no = no | 0;
        data = String(data);
        out_data[no] = data;
    }
    Interpreter.setoutdata = setoutdata;

    // ***** 外部データ取得 *****
    function getoutdata(no) {
        if (no == null) { Alm("Interpreter.getoutdata:0001"); return false; }
        no = no | 0;
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
        // ***** 互換モードの初期化 *****
        sp_compati_mode = 0;
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
        // ***** Canvasの各設定の初期化 *****
        init_canvas_setting(ctx1);
        // ***** 現在の描画先にセット *****
        can = can1;
        ctx = ctx1;
        // ***** ソフトキー表示 *****
        softkey[0] = {};
        softkey[1] = {};
        softkey[0].text = "";
        softkey[1].text = "";
        softkey[0].font_size = can2_font_size_init;
        softkey[1].font_size = can2_font_size_init;
        disp_softkey();
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
        // ***** 定数展開 *****
        try {
            expandconst();
        } catch (ex2) {
            DebugShow("token:(" + token_len + "個): ");
            msg = token.join(" ");
            DebugShow(msg + "\n");
            DebugShow("expandconst: " + ex2.message + ": debugpos=" + debugpos1 + "\n");
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
        // ***** ラベル設定 *****
        debugpos1 = 0;
        debugpos2 = 0;
        try {
            setlabel();
        } catch (ex4) {
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("setlabel: " + ex4.message + ": debugpos=" + debugpos1 + "\n");
            show_err_place(debugpos1, debugpos2);
            DebugShow("実行終了\n");
            return ret;
        }
        // ***** 実行 *****
        // vars = {};
        vars = new Vars();
        imgvars = {};
        stack = [];
        param = [];
        pc = 0;
        debugpc = 0;
        end_flag = false;
        running_flag = true; runstatchanged();
        sleep_flag = false;
        sleep_data = {};
        loop_nocount_flag = false;
        loop_nocount_mode = false;
        input_flag = false;
        keyinput_flag = false;
        funccall_stack = [];
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
        // sp_compati_mode = 0;
        use_local_vars = true;
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

        // run_continuously(); // 再帰的になるので別関数にした
        setTimeout(run_continuously, 10);

        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** 継続実行 *****
    function run_continuously() {
        var ret;
        var name;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** 継続実行 *****
        sleep_id = null;
        try {
            // ***** コード実行 *****
            // if (prof_obj) { prof_obj.start("execcode"); }
            execcode();
            // if (prof_obj) { prof_obj.stop("execcode"); }
            // ***** スリープ *****
            if (sleep_flag && !end_flag) {
                sleep_flag = false;
                // ***** 継続実行(再帰的に実行) *****
                sleep_id = setTimeout(run_continuously, sleep_time);
                return ret;
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
            DebugShow("globalvars=" + JSON.stringify(vars.getGlobalVars()) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.getLocalVars()) + "\n");
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
            DebugShow("globalvars=" + JSON.stringify(vars.getGlobalVars()) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.getLocalVars()) + "\n");
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
        var c;
        var cod;
        var num, num2;
        var var_name;
        var lbl_name;
        var func_name;
        var param_num;
        var goto_pc;
        var funccall_info;
        var time_cnt;

        // ***** コード実行のループ *****
        loop_time_start = Date.now();
        time_cnt = 0;
        while (pc < code_len) {
            // ***** コード取り出し *****
            debugpc = pc;
            cod = code[pc++];
            // ***** スタックマシンのコードを実行 *****
            switch (cod) {
                // ( case opecode.load: が遅かったので数値を直接指定する)
                case 1: // load
                    num = stack.pop();
                    var_name = stack.pop();
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 2: // pointer
                    var_name = stack.pop();
                    num = String(vars.getVarValue(var_name));
                    // ***** 変数名のチェック *****
                    // (アルファベットかアンダースコアで始まらなければエラー)
                    c = num.charCodeAt(0);
                    if (!((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || c == 0x5F)) {
                        throw new Error("ポインタの指す先が不正です。('" + num + "')");
                    }
                    stack.push(num);
                    break;
                case 3: // array
                    num = stack.pop();
                    var_name = stack.pop();
                    var_name = var_name + "[" + num + "]";
                    stack.push(var_name);
                    break;
                case 4: // store
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name);
                    stack.push(num);
                    break;
                case 5: // storenum
                    num = code[pc++];
                    stack.push(num);
                    break;
                case 6: // storestr
                    num = code[pc++];
                    stack.push(num);
                    break;
                case 7: // store0
                    stack.push(0);
                    break;
                case 8: // store1
                    stack.push(1);
                    break;
                case 9: // preinc
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name);
                    num++;
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 10: // predec
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name);
                    num--;
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 11: // postinc
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name);
                    stack.push(num);
                    num++;
                    vars.setVarValue(var_name, num);
                    break;
                case 12: // postdec
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name);
                    stack.push(num);
                    num--;
                    vars.setVarValue(var_name, num);
                    break;
                case 13: // loadadd
                    num = stack.pop();
                    var_name = stack.pop();
                    num = (+vars.getVarValue(var_name)) + (+num); // 文字の連結にならないように数値にする
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 14: // loadsub
                    num = stack.pop();
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name) - num;
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 15: // loadmul
                    num = stack.pop();
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name) * num;
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 16: // loaddiv
                    num = stack.pop();
                    var_name = stack.pop();
                    if (sp_compati_mode == 1) {
                        num = Math.trunc(vars.getVarValue(var_name) / num);
                    } else {
                        num = vars.getVarValue(var_name) / num;
                    }
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 17: // loaddivint
                    num = stack.pop();
                    var_name = stack.pop();
                    num = Math.trunc(vars.getVarValue(var_name) / num);
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 18: // loadmod
                    num = stack.pop();
                    var_name = stack.pop();
                    num = vars.getVarValue(var_name) % num;
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 19: // loadaddstr
                    num = stack.pop();
                    var_name = stack.pop();
                    num = String(vars.getVarValue(var_name)) + String(num);
                    vars.setVarValue(var_name, num);
                    stack.push(num);
                    break;
                case 20: // add
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (+num) + (+num2); // 文字の連結にならないように数値にする
                    stack.push(num);
                    break;
                case 21: // addstr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = String(num) + String(num2);
                    stack.push(num);
                    break;
                case 22: // sub
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num - num2;
                    stack.push(num);
                    break;
                case 23: // mul
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num * num2;
                    stack.push(num);
                    break;
                case 24: // div
                    num2 = stack.pop();
                    num = stack.pop();
                    if (sp_compati_mode == 1) {
                        num = Math.trunc(num / num2);
                    } else {
                        num = num / num2;
                    }
                    stack.push(num);
                    break;
                case 25: // divint
                    num2 = stack.pop();
                    num = stack.pop();
                    num = Math.trunc(num / num2);
                    stack.push(num);
                    break;
                case 26: // mod
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num % num2;
                    stack.push(num);
                    break;
                case 27: // shl
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num << num2;
                    stack.push(num);
                    break;
                case 28: // shr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num >> num2;
                    stack.push(num);
                    break;
                case 29: // ushr
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num >>> num2;
                    stack.push(num);
                    break;
                case 30: // positive
                    num = stack.pop();
                    num = +num;
                    stack.push(num);
                    break;
                case 31: // negative
                    num = stack.pop();
                    num = -num;
                    stack.push(num);
                    break;
                case 32: // and
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num & num2;
                    stack.push(num);
                    break;
                case 33: // or
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num | num2;
                    stack.push(num);
                    break;
                case 34: // xor
                    num2 = stack.pop();
                    num = stack.pop();
                    num = num ^ num2;
                    stack.push(num);
                    break;
                case 35: // not
                    num = stack.pop();
                    num = ~num;
                    stack.push(num);
                    break;
                case 36: // lognot
                    num = stack.pop();
                    num = (num == 0) ? 1 : 0;
                    stack.push(num);
                    break;
                case 37: // cmpeq
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num == num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 38: // cmpne
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num != num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 39: // cmplt
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num < num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 40: // cmple
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num <= num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 41: // cmpgt
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num > num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 42: // cmpge
                    num2 = stack.pop();
                    num = stack.pop();
                    num = (num >= num2) ? 1 : 0;
                    stack.push(num);
                    break;
                case 43: // label
                    pc++;
                    break;
                case 44: // goto
                    lbl_name = code[pc++];
                    pc = label[lbl_name];
                    break;
                case 45: // ifgoto
                    lbl_name = code[pc++];
                    num = stack.pop();
                    if (num != 0) {
                        pc = label[lbl_name];
                    }
                    break;
                case 46: // ifnotgoto
                    lbl_name = code[pc++];
                    num = stack.pop();
                    if (num == 0) {
                        pc = label[lbl_name];
                    }
                    break;
                case 47: // gotostack
                    lbl_name = stack.pop();
                    // ***** ラベルへジャンプ *****
                    // if (!label.hasOwnProperty(lbl_name)) {
                    if (!hasOwn.call(label, lbl_name)) {
                        throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                    }
                    goto_pc = label[lbl_name];
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** 関数呼び出し情報の取得 *****
                        funccall_info = funccall_stack[funccall_stack.length - 1];
                        // ***** ジャンプ先がfunc内のときだけgotoが可能 *****
                        if ((goto_pc < funccall_info.func_start) || (goto_pc >= funccall_info.func_end)) {
                            throw new Error("funcの外へは goto できません。");
                        }
                    }
                    pc = goto_pc;
                    break;
                case 48: // gosubstack
                    lbl_name = stack.pop();
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        throw new Error("func内では gosub できません。");
                    }
                    // ***** ラベルへジャンプ *****
                    // if (!label.hasOwnProperty(lbl_name)) {
                    if (!hasOwn.call(label, lbl_name)) {
                        throw new Error("ラベル '" + lbl_name + "' は未定義です。");
                    }
                    gosub_back.push(pc);
                    pc = label[lbl_name];
                    break;
                case 49: // return
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** ローカル変数を解放 *****
                        vars.deleteLocalScope();
                        // ***** 呼び出し元に復帰 *****
                        funccall_info = funccall_stack.pop();
                        pc = funccall_info.func_back;
                        break;
                    }
                    // ***** gosubのとき *****
                    if (gosub_back.length > 0) {
                        // ***** 戻り値を捨てる *****
                        stack.pop();
                        // ***** 戻り先へ *****
                        pc = gosub_back.pop();
                        break;
                    }
                    // ***** 戻り先がない *****
                    throw new Error("予期しない return が見つかりました。");
                    // break;
                case 50: // func
                    pc = func[code[pc] + "\\end"];
                    break;
                case 51: // funcend
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** 戻り値は0とする *****
                        stack.push(0);
                        // ***** ローカル変数を解放 *****
                        vars.deleteLocalScope();
                        // ***** 呼び出し元に復帰 *****
                        funccall_info = funccall_stack.pop();
                        pc = funccall_info.func_back;
                        break;
                    }
                    // ***** 戻り先がない *****
                    throw new Error("予期しない '}' が見つかりました。");
                    // break;
                case 52: // call
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    // param = stack.splice(stack.length - param_num, param_num);
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[param_num - i - 1] = stack.pop();
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    // func_name = toglobal(func_name);
                    // ***** 組み込み関数の呼び出し *****
                    num = func_tbl[func_name].func(param);
                    stack.push(num);
                    break;
                case 53: // callwait
                    // ***** 入力待ち状態のチェック *****
                    if (!(input_flag || keyinput_flag)) {
                        // ***** 引数の取得 *****
                        param_num = code[pc++];
                        // param = stack.splice(stack.length - param_num, param_num);
                        param = [];
                        for (i = 0; i < param_num; i++) {
                            param[param_num - i - 1] = stack.pop();
                        }
                    } else {
                        pc++;
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    // func_name = toglobal(func_name);
                    // ***** 組み込み関数の呼び出し *****
                    num = func_tbl[func_name].func(param);
                    // ***** 入力待ち状態でなければ完了 *****
                    if (!(input_flag || keyinput_flag)) {
                        stack.push(num);
                        break;
                    }
                    // ***** 同じ命令を繰り返す *****
                    stack.push(func_name);
                    pc -= 2;
                    break;
                case 54: // calladdfunc
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    // param = stack.splice(stack.length - param_num, param_num);
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[param_num - i - 1] = stack.pop();
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    // func_name = toglobal(func_name);
                    // ***** 組み込み関数の呼び出し *****
                    num = addfunc_tbl[func_name].func(param, vars, can, ctx);
                    stack.push(num);
                    break;
                case 55: // calluser
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    // param = stack.splice(stack.length - param_num, param_num);
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[param_num - i - 1] = stack.pop();
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    func_name = toglobal(func_name);
                    // ***** 関数の存在チェック *****
                    // if (!func.hasOwnProperty(func_name)) {
                    if (!hasOwn.call(func, func_name)) {
                        throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(関数が未定義もしくはユーザ定義関数ではない等)。");
                    }
                    // ***** ローカル変数を生成 *****
                    vars.makeLocalScope();
                    // ***** 関数呼び出し情報の生成 *****
                    funccall_info = {};
                    funccall_info.func_back = pc;
                    funccall_info.func_start = func[func_name];
                    funccall_info.func_end = func[func_name + "\\end"];
                    funccall_stack.push(funccall_info);
                    // ***** 関数の呼び出し *****
                    pc = funccall_info.func_start;
                    break;
                case 56: // gotouser
                    // ***** 引数の取得 *****
                    param_num = code[pc++];
                    // param = stack.splice(stack.length - param_num, param_num);
                    param = [];
                    for (i = 0; i < param_num; i++) {
                        param[param_num - i - 1] = stack.pop();
                    }
                    // ***** 関数名の取得 *****
                    func_name = stack.pop();
                    func_name = toglobal(func_name);
                    // ***** 関数内のとき *****
                    if (funccall_stack.length > 0) {
                        // ***** 関数の存在チェック *****
                        // if (!func.hasOwnProperty(func_name)) {
                        if (!hasOwn.call(func, func_name)) {
                            throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(関数が未定義もしくはユーザ定義関数ではない等)。");
                        }
                        // ***** コールスタックを増加させないで関数を呼び出す *****
                        // ***** ローカル変数をクリア *****
                        vars.clearLocalVars();
                        // ***** 関数呼び出し情報を更新 *****
                        funccall_stack[funccall_stack.length - 1].func_start = func[func_name];
                        funccall_stack[funccall_stack.length - 1].func_end = func[func_name + "\\end"];
                        // ***** 関数の呼び出し *****
                        pc = funccall_stack[funccall_stack.length - 1].func_start;
                        break;
                    }
                    // ***** ここでは使用不可 *****
                    throw new Error("funcgoto はユーザ定義の関数内でなければ使用できません。");
                    // break;
                case 57: // loadparam
                    if (param.length > 0) {
                        num = param.shift();
                    } else {
                        num = 0;
                    }
                    var_name = stack.pop();
                    // ***** 関数の引数のポインタ対応 *****
                    // if (var_name.substring(0, 2) == "p\\") {
                    if (var_name.charCodeAt(1) == 0x5C && var_name.charCodeAt(0) == 0x70) {
                        // (引数名から「p\」を削除)
                        var_name = var_name.substring(2);
                        // (文字列化)
                        num = String(num);
                        // ***** 変数名のチェック *****
                        // (アルファベットかアンダースコアで始まらなければエラー)
                        c = num.charCodeAt(0);
                        if (!((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || c == 0x5F)) {
                            throw new Error("ポインタの指す先が不正です。('" + num + "')");
                        }
                        // (ローカル変数のスコープをさかのぼれるように、引数の内容に「a\」と数字を付加)
                        if (num.substring(0, 2) != "a\\") {
                            num2 = vars.getLocalScopeNum() - 1;
                            // if (num2 < 0) { num2 = 0; }
                            num = "a\\" + num2 + "\\" + num;
                        }
                    }
                    vars.setVarValue(var_name, num);
                    break;
                case 58: // pop
                    stack.pop();
                    break;
                case 59: // dup
                    num = stack.pop();
                    stack.push(num);
                    stack.push(num);
                    break;
                case 60: // end
                    end_flag = true;
                    break;
                default:
                    // ***** 命令コードエラー *****
                    throw new Error("未定義の命令コード (" + cod + ") が見つかりました。");
                    // break;
            }
            // ***** 各種フラグのチェックと処理時間の測定 *****
            if (loop_nocount_flag || loop_nocount_mode) {
                // (ループ時間ノーカウントフラグがONのときは、処理時間の測定をリセットする)
                if (loop_nocount_flag && !loop_nocount_mode) {
                    loop_nocount_flag = false;
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
    //              ラベル設定処理
    // ****************************************
    // (コンパイルで生成したラベルのアドレスを解決する)

    // ***** ラベル設定 *****
    function setlabel() {
        var i, j, k;
        var cod;
        var lbl_name;
        var func_name;

        // ***** コード解析のループ *****
        i = 0;
        label = {};
        func = {};
        while (i < code_len) {
            // ***** コード取り出し *****
            debugpos1 = code_info[i].pos1;
            // cod = code[i++];
            cod = code_str[i++];
            // ***** ラベルのとき *****
            if (cod == "label") {
                lbl_name = code[i++];
                // if (label.hasOwnProperty(lbl_name)) {
                if (hasOwn.call(label, lbl_name)) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("ラベル '" + lbl_name + "' の定義が重複しています。");
                }
                label[lbl_name] = i;
                continue;
            }
            // ***** 関数定義のとき *****
            if (cod == "func") {
                func_name = code[i++];
                // if (func.hasOwnProperty(func_name)) {
                if (hasOwn.call(func, func_name)) {
                    debugpos2 = debugpos1 + 2;
                    throw new Error("関数 '" + func_name + "' の定義が重複しています。");
                }
                func[func_name] = i;
                j = i;
                k = 1;
                while (j < code_len) {
                    // cod = code[j++];
                    cod = code_str[j++];
                    // if (cod == "func") { k++; }
                    if (cod == "funcend") {
                        k--;
                        if (k == 0) {
                            func[func_name + "\\end"] = j;
                            break;
                        }
                    }
                    if (cod == "func") {
                        debugpos2 = code_info[j - 1].pos1 + 1;
                        throw new Error("funcの中にfuncを入れられません。");
                    }
                }
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
        c_statement(0, token_len, "", "");
    }

    // ***** 文(ステートメント)のコンパイル *****
    function c_statement(tok_start, tok_end, break_lbl, continue_lbl) {
        var i, j, k, k2, k3;
        var ch;
        var tok;
        var lbl_name;
        var func_name, func_stm, func_end;
        var param_num;
        var var_name;

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
            // ***** トークン取り出し *****
            debugpos1 = i;
            tok = token[i];

            // ***** 「;」のとき *****
            if (tok == ";") {
                i++;
                continue;
            }

            // ***** label文のとき *****
            if (tok == "label") {
                i++;
                code_push("label", debugpos1, i);
                // (マイナス値を許可(特別扱い))
                // lbl_name = token[i++];
                if (token[i] == "-" && isDigit(token[i + 1].charAt(0))) {
                    lbl_name = token[i] + token[i + 1];
                    i += 2;
                } else {
                    lbl_name = token[i];
                    i++;
                }
                // (文字列化)
                if (lbl_name.charAt(0) != '"') {
                    lbl_name = '"' + lbl_name + '"';
                }
                code_push(lbl_name, debugpos1, i);
                continue;
            }

            // ***** goto文のとき *****
            if (tok == "goto") {
                i++;
                i = c_expression(i, tok_end);
                code_push("gotostack", debugpos1, i);
                continue;
            }

            // ***** gosub文のとき *****
            if (tok == "gosub") {
                i++;
                i = c_expression(i, tok_end);
                code_push("gosubstack", debugpos1, i);
                continue;
            }

            // ***** return文のとき *****
            if (tok == "return") {
                i++;
                // ***** 戻り値を取得 *****
                // (直後が } のときも戻り値なしとする(過去との互換性維持のため))
                // if (token[i] == ";") {
                if (token[i] == ";" || token[i] == "}") {
                    code_push("store0", debugpos1, i);
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

            // ***** func文のとき *****
            if (tok == "func") {
                i++;
                code_push("func", debugpos1, i);
                func_name = token[i++];
                // ***** 関数名のチェック *****
                if (!(isAlpha(func_name.charAt(0)) || func_name.charAt(0) == "_")) {
                    debugpos2 = i;
                    throw new Error("関数名が不正です。('" + func_name + "')");
                }
                if (reserved.hasOwnProperty(func_name) ||
                    func_tbl.hasOwnProperty(func_name) ||
                    addfunc_tbl.hasOwnProperty(func_name)) {
                    // (一部の関数定義エラーを発生させない(過去との互換性維持のため))
                    if (sp_compati_mode == 1 && func_name != "int") {
                        debugpos2 = i;
                        throw new Error("名前 '" + func_name + "' は予約されています。関数の定義に失敗しました。");
                    }
                }
                code_push('"' + func_name + '"', debugpos1, i);
                // ***** 仮引数 *****
                match2("(", i++);
                if (token[i] == ")") {
                    i++;
                } else {
                    while (i < tok_end) {
                        // ***** 変数名のコンパイル2(関数の仮引数用) *****
                        i = c_getvarname2(i, tok_end);
                        code_push("loadparam", debugpos1, i);
                        if (token[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    match2(")", i++);
                }
                // ***** 本体 *****
                // j = i;
                match2("{", i++);
                func_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2("}", i++);
                func_end = i;
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(func_stm, func_end - 1, "", "");
                debugpos1 = i - 1; // エラー表示位置調整
                code_push("funcend", debugpos1, i);
                // i = func_end;
                continue;
            }

            // ***** funcgoto文のとき *****
            if (tok == "funcgoto") {
                i++;
                match2("(", i++);
                func_name = token[i];
                // ***** 1文字取り出す *****
                ch = func_name.charAt(0);
                // ***** アルファベットかアンダースコアかポインタのとき *****
                if (isAlpha(ch) || ch == "_" || ch == "*") {
                    // ***** 変数名のコンパイル *****
                    i = c_getvarname(i, tok_end);
                } else {
                    debugpos2 = i + 1;
                    throw new Error("関数名が不正です。('" + func_name + "')");
                }
                // ***** 引数の取得 *****
                match2("(", i++);
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
                    match2(")", i++);
                }
                // ***** 関数の呼び出し *****
                code_push("gotouser", debugpos1, i);
                // ***** 引数の数を設定 *****
                code_push(param_num, debugpos1, i);
                match2(")", i++);
                continue;
            }

            // ***** global/local/var文のとき *****
            // (loc a,b,c のように、複数の変数をカンマ区切りで一括宣言可能とする)
            if (tok == "global" || tok == "glb" || tok == "local" || tok == "loc") {
                i++;
                while (i < tok_end) {
                    j = code_len + 1;
                    i = c_expression(i, tok_end);
                    code_push("pop", debugpos1, i);
                    if (j < code_len) {
                        var_name = String(code[j]);
                        if (var_name.charAt(1) != "\\") {
                            checkvarname(var_name, i);
                            // ***** 変数名に接頭語を付ける *****
                            var_name = tok.charAt(0) + "\\" + var_name;
                            code[j] = var_name;
                            code_str[j] = '"' + var_name + '"';
                        }
                    }
                    if (token[i] == ",") {
                        i++;
                        continue;
                    }
                    break;
                }
                continue;
            }

            // ***** spmode文のとき *****
            if (tok == "spmode") {
                j = i;
                i++;
                match2("(", i++);
                if (token[i] == "0") {
                    sp_compati_mode = 0;
                } else {
                    sp_compati_mode = 1;
                }
                i++;
                match2(")", i++);
                i = j;
                // continue;
            }

            // ***** defconst文のとき *****
            if (tok == "defconst") {
                i++;
                match2("(", i++);
                i++;
                match2(",", i++);
                // (マイナス値を許可(特別扱い))
                if (token[i] == "-" && isDigit(token[i + 1].charAt(0))) {
                    i += 2;
                } else {
                    i++;
                }
                match2(")", i++);
                continue;
            }

            // ***** disconst文のとき *****
            if (tok == "disconst") {
                i++;
                match2("(", i++);
                i++;
                match2(")", i++);
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
                match2("(", i++);
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
                match2(")", i++);
                match2("{", i++);
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
                            k2 = 1;                  // caseに式を可能とする
                            k3 = 0;
                            while (i < tok_end) {
                                // if (token[i] == "?") { k2++; }
                                if (token[i] == ":") { k2--; }
                                if (token[i] == "(") { k3++; }
                                if (token[i] == ")") { k3--; }
                                if (k2 == 0 && k3 == 0) { break; }
                                i++;
                            }
                            match2(":", i++);
                            // 文
                            switch_case_stm.push(i);
                            continue;
                        }
                        if (token[i] == "default") {
                            i++;
                            switch_case_exp.push(i); // caseの1個としても登録
                            match2(":", i++);
                            // 文
                            switch_default_stm = i;
                            switch_case_stm.push(i); // caseの1個としても登録
                            continue;
                        }
                    }
                    i++;
                }
                match2("}", i++);
                // 終了
                switch_end = i;
                // ***** コードの生成 *****
                // 式
                i = c_expression2(switch_exp, switch_stm - 3);
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    if (switch_case_stm[switch_case_no] == switch_default_stm) { continue; }
                    code_push("dup", debugpos1, i);
                    // (caseの式はカンマ区切りなしに変更)
                    // i = c_expression2(switch_case_exp[switch_case_no], switch_case_stm[switch_case_no] - 2);
                    i = c_expression(switch_case_exp[switch_case_no], switch_case_stm[switch_case_no] - 2);
                    code_push("cmpeq", debugpos1, i);
                    code_push("ifgoto", debugpos1, i);
                    code_push('"switch_case_stm' + switch_case_no + '\\' + j + '"', debugpos1, i);
                }
                if (switch_default_stm >= 0) {
                    code_push("goto", debugpos1, i);
                    code_push('"switch_default_stm\\' + j + '"', debugpos1, i);
                } else {
                    code_push("goto", debugpos1, i);
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
                    c_statement(switch_case_stm[switch_case_no], switch_case_stm_end - 1, '"switch_end\\' + j + '"', continue_lbl);
                }
                // 終了
                code_push("label", debugpos1, i);
                code_push('"switch_end\\' + j + '"', debugpos1, i);
                code_push("pop", debugpos1, i);
                i = switch_end;
                continue;
            }

            // ***** if文のとき *****
            // if (式) { 文 } elsif (式) { 文 } ... elsif (式) { 文 } else { 文 }
            if (tok == "if") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", i++);
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
                match2(")", i++);
                match2("{", i++);
                // 文
                if_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2("}", i++);
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
                        match2("(", i++);
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
                        match2(")", i++);
                        match2("{", i++);
                        // 文
                        elsif_stm.push(i);
                        k = 1;
                        while (i < tok_end) {
                            if (token[i] == "{") { k++; }
                            if (token[i] == "}") { k--; }
                            if (k == 0) { break; }
                            i++;
                        }
                        match2("}", i++);
                        elsif_stm_end.push(i);
                        continue;
                    }
                    // else
                    if (token[i] == "else") {
                        debugpos1 = i; // エラー表示位置調整
                        i++;
                        match2("{", i++);
                        // 文
                        else_stm = i;
                        k = 1;
                        while (i < tok_end) {
                            if (token[i] == "{") { k++; }
                            if (token[i] == "}") { k--; }
                            if (k == 0) { break; }
                            i++;
                        }
                        match2("}", i++);
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
                c_statement(if_stm, if_stm_end - 1, break_lbl, continue_lbl);
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
                    c_statement(elsif_stm[elsif_no], elsif_stm_end[elsif_no] - 1, break_lbl, continue_lbl);
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
                    c_statement(else_stm, if_end - 1, break_lbl, continue_lbl);
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
                match2("(", i++);
                // 式1
                for_exp1 = i;
                k = 1;
                k2 = 0;
                while (i < tok_end) {
                    // if (token[i] == "?") { k++; }
                    if (token[i] == ";") { k--; }
                    if (token[i] == "(") { k2++; }
                    if (token[i] == ")") { k2--; }
                    if (k == 0 && k2 == 0) { break; }
                    i++;
                }
                match2(";", i++);
                // 式2
                for_exp2 = i;
                k = 1;
                k2 = 0;
                while (i < tok_end) {
                    // if (token[i] == "?") { k++; }
                    if (token[i] == ";") { k--; }
                    if (token[i] == "(") { k2++; }
                    if (token[i] == ")") { k2--; }
                    if (k == 0 && k2 == 0) { break; }
                    i++;
                }
                match2(";", i++);
                // 式3
                for_exp3 = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "(") { k++; }
                    if (token[i] == ")") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2(")", i++);
                match2("{", i++);
                // 文
                for_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2("}", i++);
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
                c_statement(for_stm, for_end - 1, '"for_end\\' + j + '"', '"for_exp3\\' + j + '"');
                // for (i = for_stm; i < for_end - 1; i++) {
                //     code_push(token[i], debugpos1, i);
                // }
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
                match2("(", i++);
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
                match2(")", i++);
                match2("{", i++);
                // 文
                while_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2("}", i++);
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
                c_statement(while_stm, while_end - 1, '"while_end\\' + j + '"', '"while_exp\\' + j + '"');
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
                match2("{", i++);
                // 文
                do_stm = i;
                k = 1;
                while (i < tok_end) {
                    if (token[i] == "{") { k++; }
                    if (token[i] == "}") { k--; }
                    if (k == 0) { break; }
                    i++;
                }
                match2("}", i++);
                if (token[i] != "while") {
                    debugpos2 = i + 1;
                    throw new Error("do文のwhileがありません。");
                }
                i++;
                match2("(", i++);
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
                match2(")", i++);
                // 終了
                do_end = i;
                // ***** コードの生成 *****
                // 文
                code_push("label", debugpos1, i);
                code_push('"do_stm\\' + j + '"', debugpos1, i);
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(do_stm, do_exp - 3, '"do_end\\' + j + '"', '"do_stm\\' + j + '"');
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
            // ***** トークン取り出し *****
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
                code_push("store1", debugpos1, i);
                code_push("goto", debugpos1, i);
                code_push('"and_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"and_zero\\' + j + '"', debugpos1, i);
                code_push("store0", debugpos1, i);
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
                code_push("store0", debugpos1, i);
                code_push("goto", debugpos1, i);
                code_push('"or_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"or_one\\' + j + '"', debugpos1, i);
                code_push("store1", debugpos1, i);
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
            // ***** 3項演算子「?:;」のとき *****
            if (tok == "?" && priority < 10) {
                j = i;
                i++;
                code_push("ifnotgoto", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                match2(":", i++);
                code_push("goto", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, tok_end, 9); // 右結合
                if (sp_compati_mode == 1) {
                    match2(";", i++);
                }
                code_push("label", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                tri_flag = true;
                continue;
            }

            // (3項演算子の処理後は、優先順位10の演算子しか処理しない(過去との互換性維持のため))
            if (sp_compati_mode == 1 && tri_flag == true) {
                break;
            }

            // ***** 「<<」のとき *****
            if (tok == "<<" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("shl", debugpos1, i);
                continue;
            }
            // ***** 「<」のとき *****
            if (tok == "<" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmplt", debugpos1, i);
                continue;
            }
            // ***** 「<=」のとき *****
            if (tok == "<=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmple", debugpos1, i);
                continue;
            }
            // ***** 「>>>」のとき *****
            if (tok == ">>>" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("ushr", debugpos1, i);
                continue;
            }
            // ***** 「>>」のとき *****
            if (tok == ">>" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("shr", debugpos1, i);
                continue;
            }
            // ***** 「>」のとき *****
            if (tok == ">" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpgt", debugpos1, i);
                continue;
            }
            // ***** 「>=」のとき *****
            if (tok == ">=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpge", debugpos1, i);
                continue;
            }
            // ***** 「==」のとき *****
            if (tok == "==" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpeq", debugpos1, i);
                continue;
            }
            // ***** 「!=」のとき *****
            if (tok == "!=" && priority < 20) {
                i++;
                i = c_expression(i, tok_end, 20);
                code_push("cmpne", debugpos1, i);
                continue;
            }
            // ***** 「+」のとき *****
            if (tok == "+" && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("add", debugpos1, i);
                continue;
            }
            // ***** 「.」のとき *****
            if (tok == "." && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("addstr", debugpos1, i);
                continue;
            }
            // ***** 「-」のとき *****
            if (tok == "-" && priority < 30) {
                i++;
                i = c_expression(i, tok_end, 30);
                code_push("sub", debugpos1, i);
                continue;
            }
            // ***** 「*」のとき *****
            if (tok == "*" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("mul", debugpos1, i);
                continue;
            }
            // ***** 「/」のとき *****
            if (tok == "/" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("div", debugpos1, i);
                continue;
            }
            // ***** 「\」のとき *****
            if (tok == "\\" && priority < 40) {
                i++;
                i = c_expression(i, tok_end, 40);
                code_push("divint", debugpos1, i);
                continue;
            }
            // ***** 「%」のとき *****
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

        // ***** トークン取り出し *****
        i = tok_start;
        // debugpos1 = i;
        tok = token[i];
        // ***** 「!」のとき *****
        if (tok == "!") {
            i++;
            i = c_factor(i, tok_end);
            code_push("lognot", debugpos1, i);
            return i;
        }
        // ***** 「~」のとき *****
        if (tok == "~") {
            i++;
            i = c_factor(i, tok_end);
            code_push("not", debugpos1, i);
            return i;
        }
        // ***** 「+」のとき *****
        if (tok == "+") {
            i++;
            i = c_factor(i, tok_end);
            code_push("positive", debugpos1, i);
            return i;
        }
        // ***** 「-」のとき *****
        if (tok == "-") {
            i++;
            i = c_factor(i, tok_end);
            code_push("negative", debugpos1, i);
            return i;
        }
        // ***** 「(」のとき *****
        if (tok == "(") {
            i++;
            i = c_expression2(i, tok_end);
            match2(")", i++);
            return i;
        }
        // ***** アドレス的なもののとき *****
        // ***** (変数名を取得して返す) *****
        if (tok == "&") {
            i++;
            if (token[i] == "(") {
                i++;
                i = c_getvarname(i, tok_end);
                match2(")", i++);
            } else {
                i = c_getvarname(i, tok_end);
            }
            return i;
        }
        // ***** プレインクリメント(「++」「--」)のとき *****
        if (tok == "++") {
            i++;
            i = c_getvarname(i, tok_end);
            code_push("preinc", debugpos1, i);
            return i;
        }
        if (tok == "--") {
            i++;
            i = c_getvarname(i, tok_end);
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
            code_push("storestr", debugpos1, i);
            code_push('"' + func_name + '"', debugpos1, i);
            // ***** 組み込み変数のとき *****
            if (func_type == 1 && func_tbl[func_name].param_num == -1) {
                code_push("call", debugpos1, i);
                code_push(0, debugpos1, i);
                return i;
            }
            if (func_type == 2 && addfunc_tbl[func_name].param_num == -1) {
                code_push("calladdfunc", debugpos1, i);
                code_push(0, debugpos1, i);
                return i;
            }
            // ***** 組み込み関数のとき *****
            match2("(", i++);
            // ***** 引数の取得 *****
            param_num = 0;
            if (token[i] == ")") {
                i++;
            } else {
                while (i < tok_end) {
                    // ***** 「変数名をとる引数」のとき *****
                    if ((func_type == 1 && func_tbl[func_name].param_varname_flag.hasOwnProperty(param_num)) ||
                        (func_type == 2 && addfunc_tbl[func_name].param_varname_flag.hasOwnProperty(param_num))) {
                        i = c_getvarname(i, tok_end);
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
                match2(")", i++);
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
                    code_push("call", debugpos1, i);
                }
            } else {
                code_push("calladdfunc", debugpos1, i);
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
            code_push("storestr", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** 数値のとき *****
        // (マイナス値を許可(定数展開の関係で特別扱い))
        // if (isDigit(ch)) {
        if (isDigit(ch) || ch == "-") {
            i++;
            num = +tok; // 数値にする
            code_push("storenum", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** アルファベットかアンダースコアかポインタのとき *****
        if (isAlpha(ch) || ch == "_" || ch == "*") {

            // ***** 変数名のコンパイル *****
            i = c_getvarname(i, tok_end);

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
                    match2(")", i++);
                }
                // ***** 関数の呼び出し *****
                code_push("calluser", debugpos1, i);
                // ***** 引数の数を設定 *****
                code_push(param_num, debugpos1, i);
                // ***** 戻り値を返す *****
                return i;
            }

            // ***** 変数の処理 *****

            // ***** トークン取り出し *****
            tok = token[i];
            // ***** ポストインクリメント(「++」「--」)のとき *****
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
            if (tok == "+=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loadadd", debugpos1, i);
                return i;
            }
            if (tok == "-=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loadsub", debugpos1, i);
                return i;
            }
            if (tok == "*=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loadmul", debugpos1, i);
                return i;
            }
            if (tok == "/=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loaddiv", debugpos1, i);
                return i;
            }
            if (tok == "\\=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loaddivint", debugpos1, i);
                return i;
            }
            if (tok == "%=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loadmod", debugpos1, i);
                return i;
            }
            if (tok == ".=") {
                i++;
                i = c_expression(i, tok_end);
                code_push("loadaddstr", debugpos1, i);
                return i;
            }

            // ***** 変数の値を返す *****
            code_push("store", debugpos1, i);
            return i;
        }
        // ***** 構文エラー *****
        // (一部の構文エラーを発生させない(過去との互換性維持のため))
        if (sp_compati_mode == 1 && tok == ")") {
            i++;
            code_push("store0", debugpos1, i);
            return i;
        }
        debugpos2 = i + 1;
        throw new Error("構文エラー 予期しない '" + token[i] + "' が見つかりました。");
        // ***** 戻り値を返す *****
        // i++;
        // return i;
    }

    // ***** 変数名のコンパイル(通常用) *****
    function c_getvarname(tok_start, tok_end) {
        var i;
        var var_name;
        var var_name2;

        // ***** 変数名取得 *****
        i = tok_start;
        // debugpos1 = i;
        var_name = token[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (変数の内容を変数名にする) *****
        if (var_name == "*") {
            if (token[i] == "(") {
                i++;
                i = c_getvarname(i, tok_end);
                match2(")", i++);
                code_push("pointer", debugpos1, i);
            } else {
                i = c_getvarname(i, tok_end);
                code_push("pointer", debugpos1, i);
            }
            // ***** 配列変数のとき *****
            while (token[i] == "[") {
                i++;
                // i = Math.trunc(c_expression(i, tok_end));
                i = c_expression(i, tok_end); // 配列の添字に文字列もあり
                match2("]", i++);
                code_push("array", debugpos1, i);
            }
            return i;
        }
        // ***** 接頭語のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            var_name2 = token[i++];
            checkvarname(var_name2, i);
            var_name = var_name.charAt(0) + "\\" + var_name2;
        } else {
            checkvarname(var_name, i);
        }
        // ***** 変数名をセット *****
        code_push("storestr", debugpos1, i);
        code_push('"' + var_name + '"', debugpos1, i);
        // ***** 配列変数のとき *****
        while (token[i] == "[") {
            i++;
            // i = Math.trunc(c_expression(i, tok_end));
            i = c_expression(i, tok_end); // 配列の添字に文字列もあり
            match2("]", i++);
            code_push("array", debugpos1, i);
        }
        // ***** 戻り値を返す *****
        return i;
    }
    // ***** 変数名のコンパイル2(関数の仮引数用) *****
    function c_getvarname2(tok_start, tok_end, pointer_flag) {
        var i;
        var var_name;
        var var_name2;

        // ***** 引数のチェック *****
        if (pointer_flag == null) { pointer_flag = false; }

        // ***** 変数名取得 *****
        i = tok_start;
        // debugpos1 = i;
        var_name = token[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (実際は*を削っているだけ) *****
        if (var_name == "*") {
            if (token[i] == "(") {
                i++;
                i = c_getvarname2(i, tok_end, true);
                match2(")", i++);
            } else {
                i = c_getvarname2(i, tok_end, true);
            }
            return i;
        }
        // ***** 接頭語のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            var_name2 = token[i++];
            checkvarname(var_name2, i);
            var_name = var_name.charAt(0) + "\\" + var_name2;
        } else {
            checkvarname(var_name, i);
            // ***** 関数の仮引数はデフォルトでローカル変数とする *****
            var_name = "l\\" + var_name;
        }
        // ***** ポインタ的なもののとき *****
        // (ローカル変数のスコープをさかのぼれるように「p\」を付加)
        if (pointer_flag && var_name.substring(0, 2) != "p\\") {
            var_name = "p\\" + var_name;
        }
        // ***** 変数名をセット *****
        code_push("storestr", debugpos1, i);
        code_push('"' + var_name + '"', debugpos1, i);
        // ***** 配列変数のとき *****
        while (token[i] == "[") {
            i++;
            // i = Math.trunc(c_expression(i, tok_end));
            i = c_expression(i, tok_end); // 配列の添字に文字列もあり
            match2("]", i++);
            code_push("array", debugpos1, i);
        }
        // ***** 戻り値を返す *****
        return i;
    }
    // ***** 変数名のチェック *****
    function checkvarname(var_name, tok_start) {
        var i = tok_start;

        // ***** 変数名のチェック *****
        if (!(isAlpha(var_name.charAt(0)) || var_name.charAt(0) == "_")) {
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

    // ****************************************
    //               定数展開処理
    // ****************************************
    // (トークン中の定数を実際の値に置換する)

    // ***** 定数展開 *****
    function expandconst() {
        var i;
        var ch;
        var tok;
        var cst_name;
        var cst_value;

        // ***** 定数の定義情報の生成 *****
        make_const_tbl();

        // ***** トークン解析のループ *****
        i = 0;
        while (i < token_len - 4) { // 終端のend(4個)は対象外
            // ***** トークン取り出し *****
            debugpos1 = i;
            tok = token[i];

            // ***** defconst文のとき *****
            if (tok == "defconst") {
                i++;
                match2("(", i++);
                cst_name = token[i++];
                // ***** 1文字取り出す *****
                ch = cst_name.charAt(0);
                // ***** アルファベットかアンダースコアのとき *****
                if (isAlpha(ch) || ch == "_") {
                    match2(",", i++);
                    // ***** 値の取得 *****
                    // (マイナス値を許可(特別扱い))
                    // cst_value = token[i++];
                    if (token[i] == "-" && isDigit(token[i + 1].charAt(0))) {
                        cst_value = token[i] + token[i + 1];
                        i += 2;
                    } else {
                        cst_value = token[i];
                        i++;
                    }
                    // ***** 定数の定義情報1個の生成 *****
                    const_tbl[cst_name] = cst_value;
                } else {
                    debugpos2 = i;
                    throw new Error("定数名が不正です。('" + cst_name + "')");
                }
                match2(")", i++);
                continue;
            }

            // ***** disconst文のとき *****
            if (tok == "disconst") {
                i++;
                match2("(", i++);
                cst_name = token[i++];
                // ***** 1文字取り出す *****
                ch = cst_name.charAt(0);
                // ***** アルファベットかアンダースコアのとき *****
                if (isAlpha(ch) || ch == "_") {
                    // ***** 定数の定義情報1個の削除 *****
                    delete const_tbl[cst_name];
                } else {
                    debugpos2 = i;
                    throw new Error("定数名が不正です。('" + cst_name + "')");
                }
                match2(")", i++);
                continue;
            }

            // ***** 定数のとき *****
            // if (const_tbl.hasOwnProperty(tok)) {
            if (hasOwn.call(const_tbl, tok)) {
                i++;
                // ***** 定数を実際の値に置換する *****
                token[i - 1] = const_tbl[tok];
                continue;
            }

            // ***** その他のとき *****
            i++;
        }
    }

    // ***** 定数の定義情報の生成 *****
    function make_const_tbl() {
        var cst_name;

        // ***** 定数の定義情報の生成 *****
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
        var i;
        var src_len;
        var ch, ch2;
        var tok_start;
        var dot_count;
        var zero_flag;
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
            if (i < src_len) { ch2 = src.charAt(i); } else { ch2 = ""; }

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
                    if (i < src_len) { ch2 = src.charAt(i); } else { ch2 = ""; }
                    // ***** 改行のとき *****
                    if (ch == "\r" || ch == "\n") {
                        line_no++;
                        if (ch == "\r" && ch2 == "\n") { i++; }
                        break;
                    }
                }
                continue;
            }
            // ***** コメント「/* */」のとき *****
            if (ch == "/" && ch2 == "*") {
                i++;
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    if (i < src_len) { ch2 = src.charAt(i); } else { ch2 = ""; }
                    // ***** デリミタのとき *****
                    if (ch == "*" && ch2 == "/") { i++; break; }
                    // ***** 改行のとき *****
                    if (ch == "\r" || ch == "\n") {
                        line_no++;
                        if (ch == "\r" && ch2 == "\n") { i++; }
                    }
                }
                continue;
            }
            // ***** コメント「'」のとき *****
            if (ch == "'") {
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    if (i < src_len) { ch2 = src.charAt(i); } else { ch2 = ""; }
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
            if (ch == "0" && ch2 == "x") {
                i++;
                while (i < src_len) {
                    ch = src.charAt(i);
                    if (isHex(ch)) { i++; } else { break; }
                }
                temp_st = src.substring(tok_start, i);
                temp_no = parseInt(temp_st, 16); // 16進数変換

                // ***** NaN対策 *****
                temp_no = temp_no | 0;

                if (temp_no < 0) { // 負のときは符号を分離する
                    token_push("-", line_no_s);
                    token_push(String(-temp_no), line_no_s);
                } else {
                    token_push(String(temp_no), line_no_s);
                }
                continue;
            }
            // ***** 10進数のとき *****
            if (isDigit(ch)) {
                dot_count = 0;
                zero_flag = true;
                // ***** 先頭の0をカット *****
                if (ch == "0" && isDigit(ch2)) { tok_start = i; } else { zero_flag = false; }
                while (i < src_len) {
                    // ***** 1文字取り出す(iの加算なし) *****
                    ch = src.charAt(i);
                    if (i + 1 < src_len) { ch2 = src.charAt(i + 1); } else { ch2 = ""; }
                    // ***** 小数点のチェック *****
                    if (ch == "." && isDigit(ch2)) { i++; dot_count++; continue; }
                    // ***** 数値のチェック *****
                    if (isDigit(ch)) { i++; } else { break; }
                    // ***** 先頭の0をカット *****
                    if (zero_flag && ch == "0" && isDigit(ch2)) { tok_start = i; } else { zero_flag = false; }
                }
                if (dot_count >= 2) { throw new Error("数値の小数点重複エラー"); }
                token_push(src.substring(tok_start, i), line_no_s);
                continue;
            }
            // ***** アルファベットかアンダースコアのとき *****
            if (isAlpha(ch) || ch == "_") {
                while (i < src_len) {
                    ch = src.charAt(i);
                    if (isAlpha(ch) || ch == "_" || isDigit(ch)) { i++; } else { break; }
                }
                token_push(src.substring(tok_start, i), line_no_s);
                continue;
            }
            // ***** 文字列のとき *****
            if (ch == '"') {
                while (i < src_len) {
                    // ***** 1文字取り出す *****
                    ch = src.charAt(i++);
                    if (i < src_len) { ch2 = src.charAt(i); } else { ch2 = ""; }
                    // ***** エスケープのとき *****
                    if (ch == "\\") {
                        if (ch2 == "\\" || ch2 == '"') {
                            i++;
                            continue;
                        } else {
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
                temp_st = src.substring(tok_start, i)
                    .replace(/\\"/g,  '"')   // 「"」のエスケープ
                    .replace(/\\\\/g, "\\"); // 「\」のエスケープ ← これは最後にしないといけない
                token_push(temp_st, line_no_s);
                continue;
            }
            // ***** 演算子その他のとき *****
            if (ch == "&" || ch == "|") {
                if (ch2 == ch) { i++; }
            }
            if (ch == "+" || ch == "-" || ch == "<") {
                if (ch2 == ch || ch2 == "=") { i++; }
            }
            if (ch == ">") {
                if (ch2 == "=") { i++; }
                if (ch2 == ">") {
                    i++;
                    if (i < src_len && src.charAt(i) == ">") { i++; }
                }
            }
            if (ch == "=" || ch == "!" || ch == "*" || ch == "/" || ch == "%" || ch == "\\" || ch == ".") {
                if (ch2 == "=") { i++; }
            }
            token_push(src.substring(tok_start, i), line_no_s);
        }
        // ***** 終端の追加(安全のため) *****
        token_push("end", line_no);
        token_push("end", line_no);
        token_push("end", line_no);
        token_push("end", line_no);
    }

    // ****************************************
    //                補助関数等
    // ****************************************

    // ***** 正負と小数も含めた数値チェック(-0.123等) *****
    function isFullDigit(num_st) {
        // if (num_st.match(/^[+-]?[0-9]*[\.]?[0-9]+$/)) { return true; } // 間違い
        if (num_st.match(/^[+\-]?([1-9]\d*|0)(\.\d+)?$/)) { return true; }
        return false;
    }
    // ***** 数値チェック *****
    function isDigit(ch) {
        // if (ch.match(/^[0-9]+$/)) { return true; }
        var c = ch.charCodeAt(0);
        if (c >= 0x30 && c <= 0x39) { return true; }
        return false;
    }
    // ***** アルファベットチェック *****
    function isAlpha(ch) {
        // if (ch.match(/^[a-zA-Z]+$/)) { return true; }
        var c = ch.charCodeAt(0);
        if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) { return true; }
        return false;
    }
    // ***** 16進数チェック *****
    function isHex(ch) {
        // if (ch.match(/^[a-fA-F0-9]+$/)) { return true; }
        var c = ch.charCodeAt(0);
        if ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66)) { return true; }
        return false;
    }
    // ***** 文字チェック *****
    function match2(ch, i) {
        if (i >= token_len) {
            debugpos2 = token_len;
            throw new Error("'" + ch + "' が見つかりませんでした。");
        }
        if (ch != token[i]) {
            debugpos2 = i + 1;
            throw new Error("'" + ch + "' があるべき所に '" + token[i] + "' が見つかりました。");
        }
        // ***** 加算されないので注意 *****
        // i++;
    }

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
            key_scan_stat = key_scan_stat | num; // ビットをON
            // ***** キー入力バッファ1に追加 *****
            if (input_buf.length >= 40) { input_buf.shift(); }
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
            if (keyinput_buf.length >= 40) { keyinput_buf.shift(); }
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
            key_scan_stat = key_scan_stat & ~num; // ビットをOFF
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
        if (keyinput_buf.length >= 40) { keyinput_buf.shift(); }
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

    // ***** Canvasの各設定の初期化 *****
    function init_canvas_setting(ctx) {
        // ***** フォント設定 *****
        // (フォントサイズだけはリセットしない(過去との互換性維持のため))
        // if (sp_compati_mode == 1) {
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
        x1 = x1 - axis.scaleox;  // 拡大縮小の中心座標を移動
        y1 = y1 - axis.scaleoy;
        x1 = x1 * axis.scalex;   // 拡大縮小
        y1 = y1 * axis.scaley;
        x1 = x1 + axis.scaleox;  // 拡大縮小の中心座標を元に戻す
        y1 = y1 + axis.scaleoy;
        x1 = x1 - axis.rotateox; // 回転の中心座標を移動
        y1 = y1 - axis.rotateoy;
        // ここでtを使わないと、計算結果がおかしくなるので注意
        t  = x1 * Math.cos(axis.rotate) - y1 * Math.sin(axis.rotate); // 回転
        y1 = x1 * Math.sin(axis.rotate) + y1 * Math.cos(axis.rotate);
        // x1 = t;
        x1 = t  + axis.rotateox; // 回転の中心座標を元に戻す
        y1 = y1 + axis.rotateoy;
        x1 = x1 + axis.originx;  // 原点座標を移動
        y1 = y1 + axis.originy;
        x1 = x1 | 0; // 整数化
        y1 = y1 | 0; // 整数化
        return [x1, y1];
    }

    // ***** ソフトキー表示 *****
    function disp_softkey() {
        var softkey_text;

        ctx2.clearRect(0, 0, can2.width, can2.height);
        ctx2.fillStyle = can2_forecolor_init;
        ctx2.textAlign = "left";
        ctx2.textBaseline = "top";
        softkey_text = softkey[0].text;
        if (softkey_text != "") {
            ctx2.font = softkey[0].font_size + "px " + font_family;
            if (softkey_text.charAt(0) == "*") {
                softkey_text = softkey_text.substring(1);
            } else {
                softkey_text = "[c]:" + softkey_text;
            }
            ctx2.fillText(softkey_text, 0, 2);
        }
        ctx2.textAlign = "right";
        softkey_text = softkey[1].text;
        if (softkey_text != "") {
            ctx2.font = softkey[1].font_size + "px " + font_family;
            if (softkey_text.charAt(0) == "*") {
                softkey_text = softkey_text.substring(1);
            } else {
                softkey_text = "[v]:" + softkey_text;
            }
            ctx2.fillText(softkey_text, can2.width, 2);
        }
    }

    // ***** トークン追加 *****
    function token_push(tok, line_no) {
        // token.push(tok);
        // token_line.push(line_no);
        // token_len++;
        token[token_len] = tok;
        token_line[token_len++] = line_no;
    }

    // ***** コード追加 *****
    function code_push(tok, pos1, pos2) {
        // (命令コードは数値に変換)
        if (opecode.hasOwnProperty(tok)) {
            code[code_len] = opecode[tok];
        // (文字列はダブルクォートを外す)
        } else if (tok.charAt && tok.charAt(0) == '"') {
            if (tok.length >= 2 && tok.charAt(tok.length - 1) == '"') {
                code[code_len] = tok.substring(1, tok.length - 1);
            } else {
                code[code_len] = tok.substring(1);
            }
        // (その他のときはそのまま格納)
        } else {
            code[code_len] = tok;
        }
        // (コード情報にはデバッグ位置の情報を格納)
        code_info[code_len] = {};
        code_info[code_len].pos1 = pos1;
        code_info[code_len].pos2 = pos2;
        // (コード文字列はそのまま格納)
        code_str[code_len++] = tok;
    }

    // ***** エラー場所の表示 *****
    function show_err_place(debugpos1, debugpos2) {
        var i;
        var msg;
        var msg_count;

        msg = "エラー場所: " + token_line[debugpos1] + "行: ";
        msg_count = 0;
        if (debugpos2 <= debugpos1) { debugpos2 = debugpos1 + 1; } // エラーが出ない件の対策
        for (i = debugpos1; i < debugpos2; i++) {
            if (i >= 0 && i < token_len) {
                msg = msg + token[i] + " ";
                msg_count++;
                // if (msg_count >= 100) {
                //     msg += "... ";
                //     break;
                // }
            }
        }
        if (debugpos2 >= token_len) { msg += "- プログラム最後まで検索したが文が完成せず。"; }
        DebugShow(msg + "\n");
    }

    // ***** 変数名取得 *****
    function getvarname(tok) {
        // (ここではチェック不要)
        // var c = tok.charCodeAt(0);
        // if (!((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || c == 0x5F)) {
        //     throw new Error("変数名が不正です。('" + tok + "')");
        // }
        return tok;
    }

    // ***** グローバル変数化 *****
    // (画像変数名や関数名に変換するときに使用)
    function toglobal(var_name) {
        var i = 0;
        var pre_word;
        // ***** 接頭語ありのとき *****
        // if (var_name.charAt(1) == "\\") {
        if (var_name.charCodeAt(1) == 0x5C) {
            // ***** 変数名から「a\」と数字を削除 *****
            if (var_name.substring(0, 2) == "a\\") {
                i = var_name.indexOf("\\", 2) + 1;
            }
            // ***** 接頭語の削除 *****
            pre_word = var_name.substring(i, i + 2);
            if (pre_word == "g\\" || pre_word == "l\\") { i += 2; }
            return (i > 0) ? var_name.substring(i) : var_name;
        }
        return var_name;
    }

    // ***** 変数用クラス *****
    var Vars = (function () {
        // ***** コンストラクタ *****
        function Vars() {
            this.vars_stack = [];     // ローカル/グローバル変数のスコープ(配列)
                                      //   (配列の0はグローバル変数用)
                                      //   (配列の1以後はローカル変数用)
            this.vars_stack[0] = {};  // グローバル変数用(連想配列オブジェクト)
            this.local_scope_num = 0; // ローカル変数のスコープ数

            this.array_cache = [];    // 配列変数名キャッシュ用(検索高速化のため)(配列)
            this.array_cache[0] = {}; // グローバル配列変数名キャッシュ用(連想配列オブジェクト)
        }

        // ***** 定数 *****
        // (Object.keysと配列操作のsome,filter,forEachがあるときは、そちらを利用する)
        if (Object.keys && Array.prototype.some && Array.prototype.filter && Array.prototype.forEach) {
            Vars.KeysAvailable = true;
        } else {
            Vars.KeysAvailable = false;
        }

        // ***** グローバル変数を取得する(デバッグ用) *****
        Vars.prototype.getGlobalVars = function () {
            return this.vars_stack[0];
        };
        // ***** ローカル変数を取得する(デバッグ用) *****
        Vars.prototype.getLocalVars = function () {
            if (this.local_scope_num > 0) {
                return this.vars_stack[this.local_scope_num];
            }
            return {};
        };
        // ***** ローカル変数のスコープを1個生成する *****
        Vars.prototype.makeLocalScope = function () {
            this.local_scope_num++;
            this.vars_stack[this.local_scope_num] = {};

            // (配列変数名キャッシュ対応)
            this.array_cache[this.local_scope_num] = {};
        };
        // ***** ローカル変数のスコープを1個解放する *****
        Vars.prototype.deleteLocalScope = function () {
            if (this.local_scope_num > 0) {
                this.vars_stack.pop();
                this.local_scope_num--;

                // (配列変数名キャッシュ対応)
                this.array_cache.pop();
            }
        };
        // ***** ローカル変数のスコープの保存数を返す *****
        Vars.prototype.getLocalScopeNum = function () {
            return this.local_scope_num;
        };
        // ***** 全変数を削除する *****
        Vars.prototype.clearVars = function () {
            var i;
            for (i = 0; i <= this.local_scope_num; i++) {
                this.vars_stack[i] = {};

                // (配列変数名キャッシュ対応)
                this.array_cache[i] = {};
            }
        };
        // ***** ローカル変数を削除する *****
        Vars.prototype.clearLocalVars = function () {
            if (this.local_scope_num > 0) {
                this.vars_stack[this.local_scope_num] = {};

                // (配列変数名キャッシュ対応)
                this.array_cache[this.local_scope_num] = {};
            }
        };
        // ***** 変数のタイプチェック(内部処理用) *****
        // 戻り値は、以下の3個の情報を、配列にして返す
        //   var_name   接頭語を削除した変数名
        //   now_index  ローカル/グローバル変数のスコープの番号
        //   loc_flag   ローカル変数使用フラグ
        Vars.prototype.checkType = function (var_name) {
            var i = 0;
            var now_index;
            var pre_word;
            var loc_flag;

            // ***** 関数の引数のポインタ対応 *****
            // (変数名の「a\」の後の数字により、ローカル/グローバル変数のスコープを指定)
            if (var_name.substring(0, 2) == "a\\") {
                i = var_name.indexOf("\\", 2) + 1;
                now_index = use_local_vars ? Math.trunc(var_name.substring(2, i - 1)) : 0;
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
            }
            // ***** 接頭語のチェック *****
            pre_word = var_name.substring(i, i + 2);
            if (pre_word == "l\\") {
                i += 2;
                loc_flag = true;
            } else {
                if (pre_word == "g\\") {
                    i += 2;
                    now_index = 0;
                }
                loc_flag = false;
            }
            // ***** 接頭語の削除 *****
            if (i > 0) { var_name = var_name.substring(i); }
            // ***** 戻り値を返す *****
            return [var_name, now_index, loc_flag];
        };
        // ***** 変数を削除する *****
        Vars.prototype.deleteVar = function (var_name) {
            var i;
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** ローカル/グローバル変数の存在チェック *****
            // if (now_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(now_vars, var_name)) {

                // (配列変数名キャッシュ対応)
                i = var_name.indexOf("[") + 1;
                if (i > 0) { delete this.array_cache[now_index][var_name.substring(0, i)]; }

                delete now_vars[var_name];
                return true;
            }
            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag) {
                return true;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            // if (glb_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(glb_vars, var_name)) {

                // (配列変数名キャッシュ対応)
                i = var_name.indexOf("[") + 1;
                if (i > 0) { delete this.array_cache[0][var_name.substring(0, i)]; }

                delete glb_vars[var_name];
            }
            return true;
        };
        // ***** 変数の存在チェック *****
        Vars.prototype.checkVar = function (var_name) {
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** ローカル/グローバル変数の存在チェック *****
            // if (now_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(now_vars, var_name)) {
                return true;
            }
            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag) {
                return false;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            // if (glb_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(glb_vars, var_name)) {
                return true;
            }
            return false;
        };
        // ***** 配列変数の存在チェック(内部処理用) *****
        Vars.prototype.checkArray = function (now_vars, now_index, array_name, i) {
            var var_name2;

            // (配列変数名キャッシュ対応)
            if (hasOwn.call(this.array_cache[now_index], array_name)) {
                return true;
            }

            // ***** 配列変数の存在チェック *****
            if (Vars.KeysAvailable) {
                if (Object.keys(now_vars).some(function (v) {
                    return (v.substring(0, i) == array_name);
                })) {

                    // (配列変数名キャッシュ対応)
                    this.array_cache[now_index][array_name] = true;

                    return true;
                }
            } else {
                for (var_name2 in now_vars) {
                    if (var_name2.substring(0, i) == array_name) {
                        // if (now_vars.hasOwnProperty(var_name2)) {
                        if (hasOwn.call(now_vars, var_name2)) {

                            // (配列変数名キャッシュ対応)
                            this.array_cache[now_index][array_name] = true;

                            return true;
                        }
                    }
                }
            }
            return false;
        };
        // ***** 変数の値を取得する *****
        Vars.prototype.getVarValue = function (var_name) {
            var i;
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;
            var array_name;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** ローカル/グローバル変数の存在チェック *****
            // if (now_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(now_vars, var_name)) {
                return now_vars[var_name];
            }
            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag) {
                now_vars[var_name] = 0;
                return 0;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            // if (glb_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(glb_vars, var_name)) {
                return glb_vars[var_name];
            }
            // ***** 変数が存在しなかったとき *****
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                // 配列変数名を取得する(このとき[も含める)
                array_name = var_name.substring(0, i);

                // 配列のローカル変数(番号は異なる)が存在するか
                if (this.checkArray(now_vars, now_index, array_name, i)) {
                    now_vars[var_name] = 0;
                    return 0;
                }

                // 配列のグローバル変数(番号は異なる)が存在するか
                if (this.checkArray(glb_vars, 0, array_name, i)) {
                    glb_vars[var_name] = 0;
                    return 0;
                }
            }
            now_vars[var_name] = 0;
            return 0;
        };
        // ***** 変数の値を設定する *****
        Vars.prototype.setVarValue = function (var_name, var_value) {
            var i;
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;
            var array_name;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag) {
                now_vars[var_name] = var_value;
                return true;
            }
            // ***** ローカル/グローバル変数の存在チェック *****
            // if (now_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(now_vars, var_name)) {
                now_vars[var_name] = var_value;
                return true;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            // if (glb_vars.hasOwnProperty(var_name)) {
            if (hasOwn.call(glb_vars, var_name)) {
                glb_vars[var_name] = var_value;
                return true;
            }
            // ***** 変数が存在しなかったとき *****
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                // 配列変数名を取得する(このとき[も含める)
                array_name = var_name.substring(0, i);

                // 配列のローカル変数(番号は異なる)が存在するか
                if (this.checkArray(now_vars, now_index, array_name, i)) {
                    now_vars[var_name] = var_value;
                    return 0;
                }

                // 配列のグローバル変数(番号は異なる)が存在するか
                if (this.checkArray(glb_vars, 0, array_name, i)) {
                    glb_vars[var_name] = var_value;
                    return 0;
                }
            }
            now_vars[var_name] = var_value;
            return true;
        };
        // ***** 配列変数の一括操作(内部処理用) *****
        Vars.prototype.controlArray = function (now_vars, var_name, var_name_len, func) {
            var var_name2;

            // ***** 配列変数の一括操作 *****
            // (見つかった配列変数のそれぞれについて関数funcを適用する)
            if (Vars.KeysAvailable) {
                Object.keys(now_vars).filter(function (v) {
                    return (v.substring(0, var_name_len) == var_name);
                }).forEach(func);
            } else {
                for (var_name2 in now_vars) {
                    if (var_name2.substring(0, var_name_len) == var_name) {
                        // if (now_vars.hasOwnProperty(var_name2)) {
                        if (hasOwn.call(now_vars, var_name2)) {
                            func(var_name2);
                        }
                    }
                }
            }
        };
        // ***** 配列変数の一括コピー *****
        Vars.prototype.copyArray = function (var_name, var_name2) {
            var i;
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;
            var var_name_len;
            var var_name_to;
            var self;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }
            // if (var_name2 == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** 変数に[を付加 *****
            var_name  += "[";
            var_name2 += "[";

            // ***** コピー元とコピー先の変数名が一致するときはエラーにする *****
            // (例えば、a[]をa[1][]にコピーすると無限ループのおそれがある)
            i = var_name2.indexOf(var_name);
            if (i >= 0) {
                if (i == 0 || var_name2.charAt(i - 1) == "\\") {
                    throw new Error("コピー元とコピー先の変数名が同一です。");
                }
            }

            // ***** 変数の長さを取得 *****
            var_name_len = var_name.length;
            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** ローカル/グローバル変数の存在チェック *****
            self = this;
            var_name_to = "";
            this.controlArray(now_vars, var_name, var_name_len, function (v) {
                var_name_to = var_name2 + v.substring(var_name_len);
                self.setVarValue(var_name_to, now_vars[v]);
            });
            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag || var_name_to) {
                return true;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            this.controlArray(glb_vars, var_name, var_name_len, function (v) {
                var_name_to = var_name2 + v.substring(var_name_len);
                self.setVarValue(var_name_to, glb_vars[v]);
            });
            return true;
        };
        // ***** 配列変数の一括削除 *****
        Vars.prototype.deleteArray = function (var_name) {
            var ret_array; // = []; (遅くなるので初期化しない)
            var now_index;
            var now_vars;
            var glb_vars;
            var loc_flag;
            var var_name_len;
            var delete_flag;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 接頭語ありのとき *****
            // if (var_name.charAt(1) == "\\") {
            if (var_name.charCodeAt(1) == 0x5C) {
                ret_array = this.checkType(var_name);
                var_name  = ret_array[0];
                now_index = ret_array[1];
                loc_flag  = ret_array[2];
            } else {
                now_index = use_local_vars ? this.local_scope_num : 0;
                loc_flag  = false;
            }

            // ***** 変数に[を付加 *****
            var_name += "[";
            // ***** 変数の長さを取得 *****
            var_name_len = var_name.length;
            // ***** ローカル/グローバル変数のスコープを取得 *****
            now_vars = this.vars_stack[now_index];
            // ***** ローカル/グローバル変数の存在チェック *****
            delete_flag = false;
            this.controlArray(now_vars, var_name, var_name_len, function (v) {
                delete now_vars[v];
                delete_flag = true;
            });

            // (配列変数名キャッシュ対応)
            if (delete_flag) { delete this.array_cache[now_index][var_name]; }

            // ***** これで検索完了のとき *****
            if (now_index == 0 || loc_flag || delete_flag) {
                return true;
            }
            // ***** グローバル変数のスコープを取得 *****
            glb_vars = this.vars_stack[0];
            // ***** グローバル変数の存在チェック *****
            delete_flag = false;
            this.controlArray(glb_vars, var_name, var_name_len, function (v) {
                delete glb_vars[v];
                delete_flag = true;
            });

            // (配列変数名キャッシュ対応)
            if (delete_flag) { delete this.array_cache[0][var_name]; }

            return true;
        };
        return Vars; // これがないとクラスが動かないので注意
    })();

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

            a1 = getvarname(param[0]);
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

            a1 = getvarname(param[0]);
            if (vars.checkVar(a1)) { num = 1; } else { num = 0; }
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
            vars.clearVars();
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

            // ***** Canvasの各設定のリセット2 *****
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

            a1 = getvarname(param[0]);
            a2 = Math.trunc(param[1]);
            a3 = getvarname(param[2]);
            a4 = Math.trunc(param[3]);
            a5 = Math.trunc(param[4]);

            // ***** NaN対策 *****
            a2 = a2 | 0;
            a4 = a4 | 0;
            a5 = a5 | 0;

            // ***** エラーチェック *****
            // if (a5 > max_array_size) {
            if (!(a5 <= max_array_size)) {
                throw new Error("処理する配列の個数が不正です。" + max_array_size + "以下である必要があります。");
            }
            if (a5 <= 0) { return nothing; }

            // ***** コピー処理 *****
            if (a1 == a3 && a2 < a4) {
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
                // if (!vars.checkVar(a1 + "[" + (a2 + i) + "]")) { break; }

                // a6 = vars[a1 + "[" + (a2 + i) + "]"];
                a6 = vars.getVarValue(a1 + "[" + (a2 + i) + "]");
                // vars[a3 + "[" + (a4 + i) + "]"] = a6;
                vars.setVarValue(a3 + "[" + (a4 + i) + "]", a6);
                i += i_plus;
                if ((i_plus > 0 && i <= i_end) ||
                    (i_plus < 0 && i >= i_end)) { continue; }
                break;
            }
            return nothing;
        });
        make_one_func_tbl("copyall", 2, [0, 1], function (param) {
            var a1, a2;

            a1 = getvarname(param[0]);
            a2 = getvarname(param[1]);
            // ***** 配列変数の一括コピー *****
            vars.copyArray(a1, a2);
            return nothing;
        });
        make_one_func_tbl("cos", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if (sp_compati_mode == 1) {
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
        make_one_func_tbl("dbgloopset", 1, [], function (param) {
            var a1;

            a1 = Math.trunc(param[0]);
            if (a1 == 0) {
                loop_nocount_mode = false;
                // (ループ時間ノーカウントフラグをONにして、処理時間の測定をリセットする)
                loop_nocount_flag = true;
            } else {
                loop_nocount_mode = true;
            }
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
            if (a2 != 0) { a1 = a1 + "\n"; }
            DebugShow(a1);
            return nothing;
        });
        make_one_func_tbl("dbgstop", 0, [], function (param) {
            var a1;

            a1 = "";
            if (param.length >= 1) {
                a1 = String(param[0]);
            }
            if (a1 != "") { a1 = "('" + a1 + "')"; }
            throw new Error("dbgstop命令で停止しました。" + a1);
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

            a1 = getvarname(param[0]);
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
                vars.deleteArray(a1);
            } else {
                for (i = a2; i <= a3; i++) {
                    // delete vars[a1 + "[" + i + "]"];
                    vars.deleteVar(a1 + "[" + i + "]");
                }
            }
            return nothing;
        });
        make_one_func_tbl("disimg", 1, [0], function (param) {
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                delete imgvars[a1];
            }
            // for (var prop_name in imgvars) { DebugShow(prop_name + " "); } DebugShow("\n");
            return nothing;
        });
        make_one_func_tbl("disvar", 1, [0], function (param) {
            var a1;

            a1 = getvarname(param[0]);
            // delete vars[a1];
            vars.deleteVar(a1);
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = Math.trunc(param[1]); // X
            a3 = Math.trunc(param[2]); // Y
            a4 = Math.trunc(param[3]); // アンカー
            if (a1 == "screen") {
                // ***** 水平方向 *****
                // if (a4 & 4)   { }                            // 左
                if (a4 & 8)      { a2 = a2 - can1.width; }      // 右
                else if (a4 & 1) { a2 = a2 - can1.width / 2; }  // 中央
                // ***** 垂直方向 *****
                // if (a4 & 16)  { }                            // 上
                if (a4 & 32)     { a3 = a3 - can1.height; }     // 下
                else if (a4 & 2) { a3 = a3 - can1.height / 2; } // 中央
                // ***** 画像を描画(表示画面→ターゲット) *****
                ctx.drawImage(can1, a2, a3);
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // ***** 水平方向 *****
                    // if (a4 & 4)   { }                                       // 左
                    if (a4 & 8)      { a2 = a2 - imgvars[a1].can.width; }      // 右
                    else if (a4 & 1) { a2 = a2 - imgvars[a1].can.width / 2; }  // 中央
                    // ***** 垂直方向 *****
                    // if (a4 & 16)  { }                                       // 上
                    if (a4 & 32)     { a3 = a3 - imgvars[a1].can.height; }     // 下
                    else if (a4 & 2) { a3 = a3 - imgvars[a1].can.height / 2; } // 中央
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            // if (a9 & 4)   { }                      // 左
            if (a9 & 8)      { a7 = a7 - img_w; }     // 右
            else if (a9 & 1) { a7 = a7 - img_w / 2; } // 中央
            // (垂直方向の座標を計算)
            // if (a9 & 16)  { }                      // 上
            if (a9 & 32)     { a8 = a8 - img_h; }     // 下
            else if (a9 & 2) { a8 = a8 - img_h / 2; } // 中央

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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
                rad1 = rad1 + rad2;
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
                a2 = getvarname(param[1]);
                // vars[a2] = a1;
                vars.setVarValue(a2, a1);
            }
            return nothing;
        });
        make_one_func_tbl("funcgoto", 1, [], function (param) {
            // ***** ここでは使用不可 *****
            throw new Error("funcgoto は戻り値を使用できません。");
            // return nothing;
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                num = imgvars[a1].can.height;
            } else { num = 0; }
            return num;
        });
        make_one_func_tbl("imgwidth", 1, [0], function (param) {
            var num;
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            loop_nocount_flag = true;
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

            a1 = getvarname(param[0]);
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
        make_one_func_tbl("keyscan", 1, [], function (param) {
            var num;
            var a1;

            a1 = Math.trunc(param[0]);
            if (key_down_stat[a1] == true) { num = 1; } else { num = 0; }
            return num;
        });
        make_one_func_tbl("keypresscode", -1, [], function (param) {
            var num;

            num = key_press_code;
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
            // ***** 正負と小数も含めた数値チェック(-0.123等) *****
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            // ***** Canvasの各設定の初期化 *****
            init_canvas_setting(imgvars[a1].ctx);
            // ***** 画像を格納 *****
            imgvars[a1].ctx.putImageData(img_data, 0, 0);
            return nothing;
        });
        make_one_func_tbl("loadimgdata", 2, [0], function (param) {
            var a1, a2;
            var img_obj = {};

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            return nothing;
        });
        make_one_func_tbl("loadimgstat", 1, [0], function (param) {
            var num;
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // ***** 完了フラグをチェックして返す *****
            num = 0;
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                if (imgvars[a1].hasOwnProperty("loaded")) {
                    if (imgvars[a1].loaded == false) {
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
        make_one_func_tbl("makearray", 2, [0], function (param) {
            var a1, a2, a3, a4;
            var i;

            a1 = getvarname(param[0]);
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
                vars.setVarValue(a1 + "[" + i + "]", a4);
            }
            return nothing;
        });
        make_one_func_tbl("makeimg", 3, [0], function (param) {
            var a1, a2, a3;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            // ***** Canvasの各設定の初期化 *****
            init_canvas_setting(imgvars[a1].ctx);
            return nothing;
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
            if (mouse_btn_stat[0] == true) { num = num | 1; }        // 左ボタン
            if (mouse_btn_stat[1] == true) { num = num | (1 << 2); } // 中ボタン(シフト値1でないので注意)
            if (mouse_btn_stat[2] == true) { num = num | (1 << 1); } // 右ボタン(シフト値2でないので注意)
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
            loop_nocount_flag = true;
            return nothing;
        });
        make_one_func_tbl("onlocal", 0, [], function (param) {
            use_local_vars = true;
            return nothing;
        });
        make_one_func_tbl("offlocal", 0, [], function (param) {
            use_local_vars = false;
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
                        num = num + a1.substring(j, k) + a3;
                        i++;
                        j = k + a2.length;
                    }
                }
                num = num + a1.substring(j);
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
            if (a3 > can2_width_init) {
                can2.width = a3;
                can2.style.width = a3 + "px";
                disp_softkey();
            }
            // ***** Canvasの各設定のリセット *****
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
            if (sp_compati_mode == 1) {
                num = Math.trunc(Math.sin(a1 * Math.PI / 180) * 100);
            } else {
                num = Math.sin(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl("split", 3, [0], function (param) {
            var num;
            var a1, a2, a3, a4;
            var i, j, k;

            a1 = getvarname(param[0]);
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
        });
        make_one_func_tbl("spweb", -1, [], function (param) {
            var num;

            num = 1;
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
                a3 = a1.length - a2;
            } else {
                a3 = Math.trunc(param[2]);
            }
            num = a1.substring(a2, a2 + a3);
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

            softkey[0].text = a1;
            softkey[0].font_size = a2;
            disp_softkey();
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

            softkey[1].text = a1;
            softkey[1].font_size = a2;
            disp_softkey();
            return nothing;
        });
        make_one_func_tbl("spmode", 1, [], function (param) {
            var a1;

            a1 = Math.trunc(param[0]);
            if (a1 == 0) {
                sp_compati_mode = 0;
            } else {
                sp_compati_mode = 1;
                font_size = font_size_set[0];
                ctx.font = font_size + "px " + font_family;
                use_local_vars = false;
            }
            return nothing;
        });
        make_one_func_tbl("tan", 1, [], function (param) {
            var num;
            var a1;

            a1 = (+param[0]);
            if (sp_compati_mode == 1) {
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

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
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
            // ***** Canvasの各設定のリセット *****
            reset_canvas_setting(ctx);
            return nothing;
        });
        make_one_func_tbl("trim", 1, [], function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.replace(/^\s+|\s+$/g,"");
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
            loop_nocount_flag = true;
            return num;
        });
        make_one_func_tbl("@", 1, [0], function (param) {
            var a1, a2;
            var i;

            a1 = getvarname(param[0]);
            for (i = 1; i < param.length; i++) {
                a2 = param[i];
                // vars[a1 + "[" + (i - 1) + "]"] = a2;
                vars.setVarValue(a1 + "[" + (i - 1) + "]", a2);
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
    Interpreter.getvarname = getvarname;
    Interpreter.toglobal = toglobal;
    Interpreter.set_canvas_axis = set_canvas_axis;
    Interpreter.conv_axis_point = conv_axis_point;
    Interpreter.max_array_size = max_array_size;
    Interpreter.max_str_size = max_str_size;
    Interpreter.get_imgvars = function () { return imgvars; };
    Interpreter.get_font_size = function () { return font_size; };
    Interpreter.set_color_val = function (v) { color_val = v; };
    Interpreter.set_loop_nocount = function () { loop_nocount_flag = true; };


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
                time_total = time_total + rec[i];
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
                ret = ret + this.getResult(key_name) + "\n";
            }
        }
        return ret;
    };
    return Profiler; // これがないとクラスが動かないので注意
})();


