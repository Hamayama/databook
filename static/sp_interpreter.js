// This file is encoded with UTF-8 without BOM.

// sp_interpreter.js
// 2014-3-30 v3.10


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
    var list_len;
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
        else if (ch == "\r" || ch == "\n") { split_flag = true; }
        // ***** コメント「;」のとき *****
        if (ch == ";") {
            while (i < list_len) {
                ch = list_st.charAt(i++);
                ch2 = list_st.charAt(i);
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
    // ***** ファイルの読み込み *****
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
    // ***** ファイルの読み込み *****
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
    // ***** ファイルの読み込み *****
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
//   各命令の定義は、
//     make_func_tbl_A()  (戻り値のない関数のとき)
//     make_func_tbl_B()  (戻り値のある関数のとき)
//   の中で行っています。
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
    var symbol = [];            // シンボル          (配列)
    var symbol_line = [];       // シンボルが何行目か(配列)(エラー表示用)
    var symbol_len = 0;         // シンボル数        (symbol.lengthのキャッシュ用)
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
    var loop_time_max = 3000;   // 最大ループ時間(msec) これ以上時間がかかったらエラーとする
    var loop_time_start;        // ループ開始時間(msec)
    var loop_time_count;        // ループ経過時間(msec)
    var loop_nocount_flag;      // ループ時間ノーカウントフラグ
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
    var use_addfunc;            // 追加命令使用有無
    var save_data = {};         // セーブデータ(連想配列オブジェクト)(仮)
    var prof_obj = {};          // プロファイラ実行用(Profilerクラスのインスタンス)
    var out_data = {};          // 外部データ(連想配列オブジェクト)

    var func_tbl = {};          // 組み込み関数の定義情報(連想配列オブジェクト)
    var addfunc_tbl = {};       // 追加の組み込み関数の定義情報(連想配列オブジェクト)

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
        mod:26,         shl:27,         shr:28,         ushr:29,        neg:30,
        and:31,         or:32,          xor:33,         not:34,         cmpeq:35,
        cmpne:36,       cmplt:37,       cmple:38,       cmpgt:39,       cmpge:40,
        label:41,       "goto":42,      ifgoto:43,      ifnotgoto:44,   gotostack:45,
        gosubstack:46,  "return":47,    func:48,        funcend:49,     call:50,
        callwait:51,    calladdfunc:52, calluser:53,    loadparam:54,   pop:55,
        dup:56,         end:57          };

    // ***** hasOwnPropertyをプロパティ名に使うかもしれない場合の対策 *****
    // (変数名、関数名、ラベル名、画像変数名について、
    //  obj.hasOwnProperty(prop) を hasOwn.call(obj, prop) に置換した)
    var hasOwn = Object.prototype.hasOwnProperty;

    // ***** 時間測定高速化用 *****
    // (new Date().getTime() より Date.now() の方が高速だが、
    //  Date.now() が存在しないブラウザもあるのでその対策)
    if (!Date.now) { Date.now = function () { return new Date().getTime(); }; }

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
        make_func_tbl_A();
        make_func_tbl_B();
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

    // ***** 変数用クラス *****
    var Vars = (function () {
        // ***** コンストラクタ *****
        function Vars() {
            this.globalvars = {};     // グローバル変数(連想配列オブジェクト)
            this.localvars = null;    // ローカル変数(nullまたは連想配列オブジェクト)
            this.old_vars_stack = []; // ローカル変数のスコープ保存用(配列)
        }
        // ***** 定数 *****
        // (Object.keysと配列操作のsome,filter,forEachがあるときは、そちらを利用する)
        if (Object.keys && Array.prototype.some && Array.prototype.filter && Array.prototype.forEach) {
            Vars.KeysAvailable = true;
        } else {
            Vars.KeysAvailable = false;
        }

        // ***** ローカル変数のスコープを1個生成する *****
        Vars.prototype.makeLocalScope = function () {
            if (this.localvars != null) {
                this.old_vars_stack.push(this.localvars);
            }
            this.localvars = {};
        };
        // ***** ローカル変数のスコープを1個解放する *****
        Vars.prototype.deleteLocalScope = function () {
            if (this.old_vars_stack.length > 0) {
                this.localvars = this.old_vars_stack.pop();
            } else {
                this.localvars = null;
            }
        };
        // ***** ローカル変数のスコープの保存数を返す *****
        Vars.prototype.getLocalScopeNum = function () {
            return this.old_vars_stack.length;
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
            var i, j;
            var glb, loc;
            var localvars;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                // ***** グローバル変数の存在チェック *****
                // if (this.globalvars.hasOwnProperty(var_name)) {
                if (hasOwn.call(this.globalvars, var_name)) {
                    delete this.globalvars[var_name];
                }
                return true;
            }
            // ***** ローカル変数の存在チェック *****
            // if (localvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(localvars, var_name)) {
                delete localvars[var_name];
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) { return true; }
            // ***** グローバル変数の存在チェック *****
            // if (this.globalvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(this.globalvars, var_name)) {
                delete this.globalvars[var_name];
            }
            return true;
        };
        // ***** 変数の存在チェック *****
        Vars.prototype.checkVar = function (var_name) {
            var i, j;
            var glb, loc;
            var localvars;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                // ***** グローバル変数の存在チェック *****
                // if (this.globalvars.hasOwnProperty(var_name)) {
                if (hasOwn.call(this.globalvars, var_name)) {
                    return true;
                }
                return false;
            }
            // ***** ローカル変数の存在チェック *****
            // if (localvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(localvars, var_name)) {
                return true;
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) { return false; }
            // ***** グローバル変数の存在チェック *****
            // if (this.globalvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(this.globalvars, var_name)) {
                return true;
            }
            return false;
        };
        // ***** 変数の値を取得する *****
        Vars.prototype.getVarValue = function (var_name) {
            var i, j;
            var array_name;
            var var_name2;
            var glb, loc;
            var localvars;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
            // ***** グローバル変数のみを使うとき *****
            if (localvars == null || use_local_vars == false || glb == true) {
                // ***** グローバル変数の存在チェック *****
                // if (this.globalvars.hasOwnProperty(var_name)) {
                if (hasOwn.call(this.globalvars, var_name)) {
                    return this.globalvars[var_name];
                }
                this.globalvars[var_name] = 0;
                return 0;
            }
            // ***** ローカル変数の存在チェック *****
            // if (localvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(localvars, var_name)) {
                return localvars[var_name];
            }
            // ***** ローカル変数のみを使うとき *****
            if (loc == true) {
                localvars[var_name] = 0;
                return 0;
            }
            // ***** グローバル変数の存在チェック *****
            // if (this.globalvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(this.globalvars, var_name)) {
                return this.globalvars[var_name];
            }
            // ***** 変数が存在しなかったとき *****
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                // 配列のグローバル変数(番号は異なる)が存在するか
                array_name = var_name.substring(0, i);
                if (Vars.KeysAvailable) {
                    if (Object.keys(this.globalvars).some(
                        function (v) { return (v.substring(0, i) == array_name); }
                    )) {
                        this.globalvars[var_name] = 0;
                        return 0;
                    }
                } else {
                    for (var_name2 in this.globalvars) {
                        if (var_name2.substring(0, i) == array_name) {
                            // if (this.globalvars.hasOwnProperty(var_name2)) {
                            if (hasOwn.call(this.globalvars, var_name2)) {
                                this.globalvars[var_name] = 0;
                                return 0;
                            }
                        }
                    }
                }
            }
            localvars[var_name] = 0;
            return 0;
        };
        // ***** 変数の値を設定する *****
        Vars.prototype.setVarValue = function (var_name, var_value) {
            var i, j;
            var array_name;
            var var_name2;
            var glb, loc;
            var localvars;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
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
            // ***** ローカル変数の存在チェック *****
            // if (localvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(localvars, var_name)) {
                localvars[var_name] = var_value;
                return true;
            }
            // ***** グローバル変数の存在チェック *****
            // if (this.globalvars.hasOwnProperty(var_name)) {
            if (hasOwn.call(this.globalvars, var_name)) {
                this.globalvars[var_name] = var_value;
                return true;
            }
            // ***** 変数が存在しなかったとき *****
            i = var_name.indexOf("[") + 1;
            // 配列のとき
            if (i > 0) {
                // 配列のグローバル変数(番号は異なる)が存在するか
                array_name = var_name.substring(0, i);
                if (Vars.KeysAvailable) {
                    if (Object.keys(this.globalvars).some(
                        function (v) { return (v.substring(0, i) == array_name); }
                    )) {
                        this.globalvars[var_name] = var_value;
                        return true;
                    }
                } else {
                    for (var_name2 in this.globalvars) {
                        if (var_name2.substring(0, i) == array_name) {
                            // if (this.globalvars.hasOwnProperty(var_name2)) {
                            if (hasOwn.call(this.globalvars, var_name2)) {
                                this.globalvars[var_name] = var_value;
                                return true;
                            }
                        }
                    }
                }
            }
            localvars[var_name] = var_value;
            return true;
        };
        // ***** 配列変数の一括コピー *****
        Vars.prototype.copyArray = function (var_name, var_name2) {
            var i, j;
            var glb, loc;
            var var_name_len;
            var var_name_from;
            var var_name_to;
            var localvars;
            var self;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }
            // if (var_name2 == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
            // ***** 変数に[を付加 *****
            var_name = var_name + "[";
            var_name2 = var_name2 + "[";

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
            // ***** 「グローバル変数のみを使うとき」以外のとき *****
            self = this;
            if (!(localvars == null || use_local_vars == false || glb == true)) {
                // ***** ローカル変数の存在チェック *****
                var_name_to = "";
                if (Vars.KeysAvailable) {
                    Object.keys(localvars).filter(
                        function (v) { return (v.substring(0, var_name_len) == var_name); }
                    ).forEach(
                        function (v) {
                            var_name_to = var_name2 + v.substring(var_name_len);
                            self.setVarValue(var_name_to, localvars[v]);
                        }
                    );
                } else {
                    for (var_name_from in localvars) {
                        if (var_name_from.substring(0, var_name_len) == var_name) {
                            // if (localvars.hasOwnProperty(var_name_from)) {
                            if (hasOwn.call(localvars, var_name_from)) {
                                var_name_to = var_name2 + var_name_from.substring(var_name_len);
                                this.setVarValue(var_name_to, localvars[var_name_from]);
                            }
                        }
                    }
                }
                if (var_name_to) { return true; }
                // ***** ローカル変数のみを使うとき *****
                if (loc == true) { return true; }
            }
            // ***** グローバル変数の存在チェック *****
            if (Vars.KeysAvailable) {
                Object.keys(this.globalvars).filter(
                    function (v) { return (v.substring(0, var_name_len) == var_name); }
                ).forEach(
                    function (v) {
                        var_name_to = var_name2 + v.substring(var_name_len);
                        self.setVarValue(var_name_to, self.globalvars[v]);
                    }
                );
            } else {
                for (var_name_from in this.globalvars) {
                    if (var_name_from.substring(0, var_name_len) == var_name) {
                        // if (this.globalvars.hasOwnProperty(var_name_from)) {
                        if (hasOwn.call(this.globalvars, var_name_from)) {
                            var_name_to = var_name2 + var_name_from.substring(var_name_len);
                            this.setVarValue(var_name_to, this.globalvars[var_name_from]);
                        }
                    }
                }
            }
            return true;
        };
        // ***** 配列変数の一括削除 *****
        Vars.prototype.deleteArray = function (var_name) {
            var i, j;
            var glb, loc;
            var var_name_len;
            var var_name2;
            var delete_flag;
            var localvars;
            var self;

            // // ***** 引数のチェック *****
            // if (var_name == "") { return true; }

            // ***** 関数の引数のポインタ対応 *****
            // ***** ローカル変数のスコープを取得する *****
            // (変数名の「a\」の後の数字により、ローカル変数のスコープをさかのぼる)
            if (var_name.substring(0, 2) == "a\\") {
                j = var_name.indexOf("\\", 2) + 1;
                i = parseInt(var_name.substring(2, j), 10) - 1;
                var_name = var_name.substring(j);
                if (i >= 0) { localvars = this.old_vars_stack[i]; } else { localvars = null; }
            } else { localvars = this.localvars; }

            // ***** 接頭語のチェック *****
            glb = false;
            loc = false;
            if (var_name.substring(0, 2) == "g\\") { glb = true; var_name = var_name.substring(2); }
            if (var_name.substring(0, 2) == "l\\") { loc = true; var_name = var_name.substring(2); }
            // ***** 変数に[を付加 *****
            var_name = var_name + "[";
            // ***** 変数の長さを取得 *****
            var_name_len = var_name.length;
            // ***** 「グローバル変数のみを使うとき」以外のとき *****
            self = this;
            if (!(localvars == null || use_local_vars == false || glb == true)) {
                // ***** ローカル変数の存在チェック *****
                delete_flag = false;
                if (Vars.KeysAvailable) {
                    Object.keys(localvars).filter(
                        function (v) { return (v.substring(0, var_name_len) == var_name); }
                    ).forEach(
                        function (v) {
                            delete localvars[v];
                            delete_flag = true;
                        }
                    );
                } else {
                    for (var_name2 in localvars) {
                        if (var_name2.substring(0, var_name_len) == var_name) {
                            // if (localvars.hasOwnProperty(var_name2)) {
                            if (hasOwn.call(localvars, var_name2)) {
                                delete localvars[var_name2];
                                delete_flag = true;
                            }
                        }
                    }
                }
                if (delete_flag) { return true; }
                // ***** ローカル変数のみを使うとき *****
                if (loc == true) { return true; }
            }
            // ***** グローバル変数の存在チェック *****
            if (Vars.KeysAvailable) {
                Object.keys(this.globalvars).filter(
                    function (v) { return (v.substring(0, var_name_len) == var_name); }
                ).forEach(
                    function (v) {
                        delete self.globalvars[v];
                    }
                );
            } else {
                for (var_name2 in this.globalvars) {
                    if (var_name2.substring(0, var_name_len) == var_name) {
                        // if (this.globalvars.hasOwnProperty(var_name2)) {
                        if (hasOwn.call(this.globalvars, var_name2)) {
                            delete this.globalvars[var_name2];
                        }
                    }
                }
            }
            return true;
        };
        return Vars; // これがないとクラスが動かないので注意
    })();

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
        if (i >= symbol_len) {
            debugpos2 = symbol_len;
            throw new Error("'" + ch + "' が見つかりませんでした。");
        }
        if (ch != symbol[i]) {
            debugpos2 = i + 1;
            throw new Error("'" + ch + "' があるべき所に '" + symbol[i] + "' が見つかりました。");
        }
        // ***** 加算されないので注意 *****
        // i++;
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
    // ***** Canvasの座標変換 *****
    // (座標系の変換を適用して、グラフィックスの座標(x,y)から
    //  実際の画面上の座標(ret_obj.x, ret_obj.y)を取得する。
    //  戻り値は、引数 ret_obj のプロパティにセットして返す)
    function conv_axis_point(x, y, ret_obj) {
        var x1, y1, t1;
        // ***** 座標系の変換の分を補正 *****
        x1 = x;
        y1 = y;
        x1 = x1 - ctx_scaleox;  // 拡大縮小の中心座標を移動
        y1 = y1 - ctx_scaleoy;
        x1 = x1 * ctx_scalex;   // 拡大縮小
        y1 = y1 * ctx_scaley;
        x1 = x1 + ctx_scaleox;  // 拡大縮小の中心座標を元に戻す
        y1 = y1 + ctx_scaleoy;
        x1 = x1 - ctx_rotateox; // 回転の中心座標を移動
        y1 = y1 - ctx_rotateoy;
        // ここでt1を使わないと、計算結果がおかしくなるので注意
        t1 = x1 * Math.cos(ctx_rotate) - y1 * Math.sin(ctx_rotate); // 回転
        y1 = x1 * Math.sin(ctx_rotate) + y1 * Math.cos(ctx_rotate);
        // x1 = t1;
        x1 = t1 + ctx_rotateox; // 回転の中心座標を元に戻す
        y1 = y1 + ctx_rotateoy;
        x1 = x1 + ctx_originx;  // 原点座標を移動
        y1 = y1 + ctx_originy;
        ret_obj.x = x1 | 0; // 整数化
        ret_obj.y = y1 | 0; // 整数化
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


    // ===== 以下は実行処理 =====
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
        debugpos1 = 0;
        try {
            initsymbol();
        } catch (ex1) {
            DebugShow("symbol:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
            DebugShow("initsymbol: " + ex1.message + "\n");
            debugpos1 = symbol_len - 1;
            if (debugpos1 < 0) { debugpos1 = 0; }
            msg = "エラー場所: " + symbol_line[debugpos1] + "行";
            DebugShow(msg + "\n");
            DebugShow("実行終了\n");
            return ret;
        }
        if (debug_mode == 1) {
            DebugShow("symbol:(" + symbol_len + "個): ");
            msg = symbol.join(" ");
            DebugShow(msg + "\n");
        }
        // ***** コンパイル *****
        debugpos1 = 0;
        debugpos2 = 0;
        try {
            compile();
        } catch (ex2) {
            if (debug_mode == 0) {
                DebugShow("symbol:(" + symbol_len + "個): ");
                msg = symbol.join(" ");
                DebugShow(msg + "\n");
            }
            DebugShow("code  :(" + code_len + "個): ");
            msg = code_str.join(" ");
            DebugShow(msg + "\n");
            DebugShow("compile: " + ex2.message + ": debugpos=" + debugpos1 + "\n");
            show_err_place(debugpos1, debugpos2);
            DebugShow("実行終了\n");
            return ret;
        }
        if (debug_mode == 1) {
            DebugShow("code  :(" + code_len + "個): ");
            msg = code_str.join(" ");
            DebugShow(msg + "\n");
        }
        // ***** ラベル設定 *****
        debugpos1 = 0;
        debugpos2 = 0;
        try {
            setlabel();
        } catch (ex3) {
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("setlabel: " + ex3.message + ": debugpos=" + debugpos1 + "\n");
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
        loop_nocount_flag = false;
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
        sp_compati_mode = 0;
        use_local_vars = true;
        use_addfunc = true;
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
        var time_cnt;

        // ***** 戻り値の初期化 *****
        ret = false;
        // ***** 継続実行 *****
        sleep_id = null;
        try {
            // loop_time_start = new Date().getTime();
            loop_time_start = Date.now();
            time_cnt = 0;
            while (pc < code_len) {

                // ***** コード実行 *****
                // if (prof_obj) { prof_obj.start("execcode"); }
                execcode();
                // if (prof_obj) { prof_obj.stop("execcode"); }
                // DebugShow(pc + " ");

                // ***** 各種フラグのチェックと処理時間の測定 *****
                if (loop_nocount_flag) {
                    loop_nocount_flag = false;
                    // ***** ループ時間ノーカウントフラグがONのときは処理時間に含めない *****
                    // loop_time_start = new Date().getTime();
                    loop_time_start = Date.now();
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
                if (end_flag) { break; }
                if (sleep_flag) {
                    sleep_flag = false;
                    // ***** 継続実行(再帰的に実行) *****
                    sleep_id = setTimeout(run_continuously, sleep_time);
                    // ***** 戻り値を返す *****
                    ret = true;
                    return ret;
                }
            }
            // DebugShow(pc + "\n");
        } catch (ex4) {
            if (prof_obj) { prof_obj.stop("result"); }
            debugpos1 = code_info[debugpc].pos1;
            debugpos2 = code_info[debugpc].pos2;
            DebugShow("execcode: " + ex4.message + ": debugpos=" + debugpos1 + ", debugpc=" + debugpc + "\n");
            show_err_place(debugpos1, debugpos2);
            // ***** プラグイン用の実行後処理 *****
            for (name in after_run_funcs) {
                if (after_run_funcs.hasOwnProperty(name)) {
                    after_run_funcs[name]();
                }
            }
            // ***** エラー終了 *****
            running_flag = false; runstatchanged();
            DebugShow("実行終了\n");
            DebugShow("globalvars=" + JSON.stringify(vars.globalvars) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.localvars) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("stack=" + JSON.stringify(stack) + "\n");
            if (prof_obj && Profiler.MicroSecAvailable) { DebugShow(prof_obj.getAllResult()); }
            return ret;
        }
        if (prof_obj) { prof_obj.stop("result"); }
        // ***** プラグイン用の実行後処理 *****
        for (name in after_run_funcs) {
            if (after_run_funcs.hasOwnProperty(name)) {
                after_run_funcs[name]();
            }
        }
        // ***** 終了 *****
        running_flag = false; runstatchanged();
        DebugShow("実行終了\n");
        if (debug_mode == 1) {
            DebugShow("globalvars=" + JSON.stringify(vars.globalvars) + "\n");
            DebugShow("localvars=" + JSON.stringify(vars.localvars) + "\n");
            DebugShow("label=" + JSON.stringify(label) + "\n");
            DebugShow("func=" + JSON.stringify(func) + "\n");
            DebugShow("stack=" + JSON.stringify(stack) + "\n");
        }
        if (prof_obj && Profiler.MicroSecAvailable) { DebugShow(prof_obj.getAllResult()); }
        // ***** 戻り値を返す *****
        ret = true;
        return ret;
    }

    // ***** エラー場所の表示 *****
    function show_err_place(debugpos1, debugpos2) {
        var i;
        var msg;
        var msg_count;

        msg = "エラー場所: " + symbol_line[debugpos1] + "行: ";
        msg_count = 0;
        if (debugpos2 <= debugpos1) { debugpos2 = debugpos1 + 1; } // エラーが出ない件の対策
        for (i = debugpos1; i < debugpos2; i++) {
            if (i >= 0 && i < symbol_len) {
                msg = msg + symbol[i] + " ";
                msg_count++;
                // if (msg_count >= 100) {
                //     msg += "... ";
                //     break;
                // }
            }
        }
        if (debugpos2 >= symbol_len) { msg += "プログラム最後まで検索したが文が完成せず"; }
        DebugShow(msg + "\n");
    }

    // ***** コード実行 *****
    function execcode() {
        var i;
        var c;
        var sym;
        var num, num2;
        var var_name;
        var lbl_name;
        var func_name;
        var param_num;
        var goto_pc;
        var funccall_info;

        // loop_nocount_flag = true;
        // ***** シンボル取り出し *****
        debugpc = pc;
        sym = code[pc++];
        // ***** 命令コードの処理 *****
        switch (sym) {
            // ( case opecode.load: が遅かったので数値を直接指定する)
            case 1: // load
                num = stack.pop();
                var_name = stack.pop();
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
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
                return true;
            case 3: // array
                num = stack.pop();
                var_name = stack.pop();
                var_name = var_name + "[" + num + "]";
                stack.push(var_name);
                return true;
            case 4: // store
                var_name = stack.pop();
                num = vars.getVarValue(var_name);
                stack.push(num);
                return true;
            case 5: // storenum
                num = code[pc++];
                stack.push(num);
                return true;
            case 6: // storestr
                num = code[pc++];
                stack.push(num);
                return true;
            case 7: // store0
                stack.push(0);
                return true;
            case 8: // store1
                stack.push(1);
                return true;
            case 9: // preinc
                var_name = stack.pop();
                num = vars.getVarValue(var_name);
                num++;
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 10: // predec
                var_name = stack.pop();
                num = vars.getVarValue(var_name);
                num--;
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 11: // postinc
                var_name = stack.pop();
                num = vars.getVarValue(var_name);
                stack.push(num);
                num++;
                vars.setVarValue(var_name, num);
                return true;
            case 12: // postdec
                var_name = stack.pop();
                num = vars.getVarValue(var_name);
                stack.push(num);
                num--;
                vars.setVarValue(var_name, num);
                return true;
            case 13: // loadadd
                num = stack.pop();
                var_name = stack.pop();
                num = (+vars.getVarValue(var_name)) + (+num); // 文字の連結にならないように数値にする
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 14: // loadsub
                num = stack.pop();
                var_name = stack.pop();
                num = vars.getVarValue(var_name) - num;
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 15: // loadmul
                num = stack.pop();
                var_name = stack.pop();
                num = vars.getVarValue(var_name) * num;
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 16: // loaddiv
                num = stack.pop();
                var_name = stack.pop();
                if (sp_compati_mode == 1) {
                    num = parseInt(vars.getVarValue(var_name) / num, 10);
                } else {
                    num = vars.getVarValue(var_name) / num;
                }
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 17: // loaddivint
                num = stack.pop();
                var_name = stack.pop();
                num = parseInt(vars.getVarValue(var_name) / num, 10);
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 18: // loadmod
                num = stack.pop();
                var_name = stack.pop();
                num = vars.getVarValue(var_name) % num;
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 19: // loadaddstr
                num = stack.pop();
                var_name = stack.pop();
                num = String(vars.getVarValue(var_name)) + String(num);
                vars.setVarValue(var_name, num);
                stack.push(num);
                return true;
            case 20: // add
                num2 = stack.pop();
                num = stack.pop();
                num = (+num) + (+num2); // 文字の連結にならないように数値にする
                stack.push(num);
                return true;
            case 21: // addstr
                num2 = stack.pop();
                num = stack.pop();
                num = String(num) + String(num2);
                stack.push(num);
                return true;
            case 22: // sub
                num2 = stack.pop();
                num = stack.pop();
                num = num - num2;
                stack.push(num);
                return true;
            case 23: // mul
                num2 = stack.pop();
                num = stack.pop();
                num = num * num2;
                stack.push(num);
                return true;
            case 24: // div
                num2 = stack.pop();
                num = stack.pop();
                if (sp_compati_mode == 1) {
                    num = parseInt(num / num2, 10);
                } else {
                    num = num / num2;
                }
                stack.push(num);
                return true;
            case 25: // divint
                num2 = stack.pop();
                num = stack.pop();
                num = parseInt(num / num2, 10);
                stack.push(num);
                return true;
            case 26: // mod
                num2 = stack.pop();
                num = stack.pop();
                num = num % num2;
                stack.push(num);
                return true;
            case 27: // shl
                num2 = stack.pop();
                num = stack.pop();
                num = num << num2;
                stack.push(num);
                return true;
            case 28: // shr
                num2 = stack.pop();
                num = stack.pop();
                num = num >> num2;
                stack.push(num);
                return true;
            case 29: // ushr
                num2 = stack.pop();
                num = stack.pop();
                num = num >>> num2;
                stack.push(num);
                return true;
            case 30: // neg
                num = stack.pop();
                num = -num;
                stack.push(num);
                return true;
            case 31: // and
                num2 = stack.pop();
                num = stack.pop();
                num = num & num2;
                stack.push(num);
                return true;
            case 32: // or
                num2 = stack.pop();
                num = stack.pop();
                num = num | num2;
                stack.push(num);
                return true;
            case 33: // xor
                num2 = stack.pop();
                num = stack.pop();
                num = num ^ num2;
                stack.push(num);
                return true;
            case 34: // not
                num = stack.pop();
                num = ~num;
                stack.push(num);
                return true;
            case 35: // cmpeq
                num2 = stack.pop();
                num = stack.pop();
                num = (num == num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 36: // cmpne
                num2 = stack.pop();
                num = stack.pop();
                num = (num != num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 37: // cmplt
                num2 = stack.pop();
                num = stack.pop();
                num = (num < num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 38: // cmple
                num2 = stack.pop();
                num = stack.pop();
                num = (num <= num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 39: // cmpgt
                num2 = stack.pop();
                num = stack.pop();
                num = (num > num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 40: // cmpge
                num2 = stack.pop();
                num = stack.pop();
                num = (num >= num2) ? 1 : 0;
                stack.push(num);
                return true;
            case 41: // label
                pc++;
                return true;
            case 42: // goto
                lbl_name = code[pc++];
                pc = label[lbl_name];
                return true;
            case 43: // ifgoto
                lbl_name = code[pc++];
                num = stack.pop();
                if (num != 0) {
                    pc = label[lbl_name];
                }
                return true;
            case 44: // ifnotgoto
                lbl_name = code[pc++];
                num = stack.pop();
                if (num == 0) {
                    pc = label[lbl_name];
                }
                return true;
            case 45: // gotostack
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
                return true;
            case 46: // gosubstack
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
                return true;
            case 47: // return
                // ***** 関数内のとき *****
                if (funccall_stack.length > 0) {
                    // ***** ローカル変数を解放 *****
                    vars.deleteLocalScope();
                    // ***** 呼び出し元に復帰 *****
                    funccall_info = funccall_stack.pop();
                    pc = funccall_info.func_back;
                    return true;
                }
                // ***** gosubのとき *****
                if (gosub_back.length > 0) {
                    // ***** 戻り値を捨てる *****
                    stack.pop();
                    // ***** 戻り先へ *****
                    pc = gosub_back.pop();
                    return true;
                }
                // ***** 戻り先がない *****
                throw new Error("予期しない return が見つかりました。");
                // return true;
            case 48: // func
                pc = func[code[pc] + "\\end"];
                return true;
            case 49: // funcend
                // ***** 関数内のとき *****
                if (funccall_stack.length > 0) {
                    // ***** 戻り値は0とする *****
                    stack.push(0);
                    // ***** ローカル変数を解放 *****
                    vars.deleteLocalScope();
                    // ***** 呼び出し元に復帰 *****
                    funccall_info = funccall_stack.pop();
                    pc = funccall_info.func_back;
                    return true;
                }
                // ***** 戻り先がない *****
                throw new Error("予期しない '}' が見つかりました。");
                // return true;
            case 50: // call
                // ***** 引数の取得 *****
                param_num = stack.pop();
                param = [];
                for(i = 0; i < param_num; i++) {
                    param[param_num - i - 1] = stack.pop();
                }
                // ***** 関数名の取得 *****
                func_name = stack.pop();
                // func_name = toglobal(func_name);
                // ***** 組み込み関数の呼び出し *****
                num = func_tbl[func_name].func(param);
                if (!func_tbl[func_name].use_retval) { num = 0; }
                stack.push(num);
                return true;
            case 51: // callwait
                // ***** 入力待ち状態のチェック *****
                if (!(input_flag || keyinput_flag)) {
                    // ***** 引数の取得 *****
                    param_num = stack.pop();
                    param = [];
                    for(i = 0; i < param_num; i++) {
                        param[param_num - i - 1] = stack.pop();
                    }
                }
                // ***** 関数名の取得 *****
                func_name = stack.pop();
                // func_name = toglobal(func_name);
                // ***** 組み込み関数の呼び出し *****
                num = func_tbl[func_name].func(param);
                if (!func_tbl[func_name].use_retval) { num = 0; }
                // ***** 入力待ち状態でなければ完了 *****
                if (!(input_flag || keyinput_flag)) {
                    stack.push(num);
                    return true;
                }
                // ***** 同じ命令を繰り返す *****
                stack.push(func_name);
                pc--;
                return true;
            case 52: // calladdfunc
                // ***** 引数の取得 *****
                param_num = stack.pop();
                param = [];
                for(i = 0; i < param_num; i++) {
                    param[param_num - i - 1] = stack.pop();
                }
                // ***** 関数名の取得 *****
                func_name = stack.pop();
                // func_name = toglobal(func_name);
                // ***** 組み込み関数の呼び出し *****
                if (!use_addfunc) {
                    throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(追加命令が無効に設定されています)。");
                }
                num = addfunc_tbl[func_name].func(param, vars, can, ctx);
                if (!addfunc_tbl[func_name].use_retval) { num = 0; }
                stack.push(num);
                return true;
            case 53: // calluser
                // ***** 引数の取得 *****
                param_num = stack.pop();
                param = [];
                for(i = 0; i < param_num; i++) {
                    param[param_num - i - 1] = stack.pop();
                }
                // ***** 関数名の取得 *****
                func_name = stack.pop();
                func_name = toglobal(func_name);
                // ***** 関数の存在チェック *****
                // if (!func.hasOwnProperty(func_name)) {
                if (!hasOwn.call(func, func_name)) {
                    throw new Error("関数 '" + func_name + "' の呼び出しに失敗しました(関数が未定義です)。");
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
                pc = func[func_name];
                return true;
            case 54: // loadparam
                if (param.length > 0) {
                    num = param.shift();
                } else {
                    num = 0;
                }
                var_name = stack.pop();
                // ***** 関数の引数のポインタ対応 *****
                if (var_name.substring(0, 2) == "p\\") {
                    // (引数名から「p\」を削除)
                    var_name = var_name.substring(2);
                    // ***** 変数名のチェック *****
                    // (アルファベットかアンダースコアで始まらなければエラー)
                    c = num.charCodeAt(0);
                    if (!((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || c == 0x5F)) {
                        throw new Error("ポインタの指す先が不正です。('" + num + "')");
                    }
                    // (ローカル変数のスコープをさかのぼれるように、引数の内容に「a\」と数字を付加)
                    if (num.substring(0, 2) != "a\\") {
                        num = "a\\" + vars.getLocalScopeNum() + "\\" + num;
                    }
                }
                vars.setVarValue(var_name, num);
                return true;
            case 55: // pop
                stack.pop();
                return true;
            case 56: // dup
                num = stack.pop();
                stack.push(num);
                stack.push(num);
                return true;
            case 57: // end
                end_flag = true;
                return true;
        }
        // ***** 命令コードエラー *****
        throw new Error("未定義の命令コード (" + sym + ") が見つかりました。");
        // return true;
    }

    // ***** 変数名取得 *****
    function getvarname(sym) {
        // (ここではチェック不要)
        // var c = sym.charCodeAt(0);
        // if (!((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) || c == 0x5F)) {
        //     throw new Error("変数名が不正です。('" + sym + "')");
        // }
        return sym;
    }

    // ***** グローバル変数化 *****
    // (画像変数名や関数名に変換するときに使用)
    function toglobal(var_name) {
        // ***** 変数名から「a\」と数字を削除 *****
        if (var_name.substring(0, 2) == "a\\") {
            var_name = var_name.substring(var_name.indexOf("\\", 2) + 1);
        }
        // ***** 接頭語の削除 *****
        if (var_name.substring(0, 2) == "g\\") { var_name = var_name.substring(2); }
        if (var_name.substring(0, 2) == "l\\") { var_name = var_name.substring(2); }
        return var_name;
    }


    // ===== 以下はラベル設定処理 =====
    // (コンパイルで生成したラベルのアドレスを解決する)


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
        while (i < code_len) {
            // ***** シンボル取り出し *****
            debugpos1 = code_info[i].pos1;
            // sym = code[i++];
            sym = code_str[i++];
            // ***** ラベルのとき *****
            if (sym == "label") {
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
            if (sym == "func") {
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
                    // sym = code[j++];
                    sym = code_str[j++];
                    // if (sym == "func") { k++; }
                    if (sym == "funcend") {
                        k--;
                        if (k == 0) {
                            func[func_name + "\\end"] = j;
                            break;
                        }
                    }
                    if (sym == "func") {
                        debugpos2 = code_info[j - 1].pos1 + 1;
                        throw new Error("funcの中にfuncを入れられません。");
                    }
                }
                continue;
            }
        }
    }


    // ===== 以下はコンパイル処理 =====
    // (シンボルを解析してスタックマシンのコードを生成する)


    // ***** コンパイル *****
    function compile() {
        // ***** 文(ステートメント)のコンパイル *****
        code = [];
        code_info = [];
        code_str = [];
        code_len = 0;
        c_statement(0, symbol_len, "", "");
    }

    // ***** 文(ステートメント)のコンパイル *****
    function c_statement(sym_start, sym_end, break_lbl, continue_lbl) {
        var i, j, k, k2;
        var sym;

        var func_name, func_stm, func_end;

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
            // ***** シンボル取り出し *****
            debugpos1 = i;
            sym = symbol[i];

            // ***** 「;」のとき *****
            if (sym == ";") {
                i++;
                continue;
            }

            // ***** label文のとき *****
            if (sym == "label") {
                i++;
                code_push("label", debugpos1, i);
                code_push('"' + symbol[i++] + '"', debugpos1, i);
                continue;
            }

            // ***** goto文のとき *****
            if (sym == "goto") {
                i++;
                i = c_expression(i, sym_end);
                code_push("gotostack", debugpos1, i);
                continue;
            }

            // ***** gosub文のとき *****
            if (sym == "gosub") {
                i++;
                i = c_expression(i, sym_end);
                code_push("gosubstack", debugpos1, i);
                continue;
            }

            // ***** return文のとき *****
            if (sym == "return") {
                i++;
                // ***** 戻り値を取得 *****
                // (直後が } のときも戻り値なしとする(過去との互換性維持のため))
                // if (symbol[i] == ";") {
                if (symbol[i] == ";" || symbol[i] == "}") {
                    code_push("store0", debugpos1, i);
                } else {
                    i = c_expression(i, sym_end);
                }
                code_push("return", debugpos1, i);
                continue;
            }

            // ***** end文のとき *****
            if (sym == "end") {
                i++;
                code_push("end", debugpos1, i);
                continue;
            }

            // ***** func文のとき *****
            if (sym == "func") {
                i++;
                code_push("func", debugpos1, i);
                func_name = symbol[i++];
                // ***** 関数名のチェック *****
                if (!(isAlpha(func_name.charAt(0)) || func_name.charAt(0) == "_")) {
                    debugpos2 = i;
                    throw new Error("関数名が不正です。");
                }
                code_push('"' + func_name + '"', debugpos1, i);
                // ***** 仮引数 *****
                match2("(", i++);
                if (symbol[i] == ")") {
                    i++;
                } else {
                    while (i < sym_end) {
                        // ***** 変数名のコンパイル2(関数の仮引数用) *****
                        i = c_getvarname2(i, sym_end);
                        code_push("loadparam", debugpos1, i);
                        if (symbol[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    match2(")", i++);
                }
                // ***** 本体 *****
                j = i;
                match2("{", j++);
                func_stm = j;
                k = 1;
                while (j < sym_end) {
                    if (symbol[j] == "{") { k++; }
                    if (symbol[j] == "}") { k--; }
                    if (k == 0) { break; }
                    j++;
                }
                match2("}", j++);
                func_end = j;
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(func_stm, func_end - 1, "", "");
                debugpos1 = j - 1; // エラー表示位置調整
                code_push("funcend", debugpos1, j);
                i = func_end;
                continue;
            }

            // ***** break文のとき *****
            if (sym == "break") {
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
            if (sym == "continue") {
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
            if (sym == "switch") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                switch_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpos2 = j + 1;
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
                                debugpos2 = j + 1;
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
                            switch_case_exp.push(j); // caseの1個としても登録
                            match2(":", j++);
                            // 文
                            switch_default_stm = j;
                            switch_case_stm.push(j); // caseの1個としても登録
                            continue;
                        }
                    }
                    j++;
                }
                match2("}", j++);
                // 終了
                switch_end = j;
                // ***** 新しいシンボルの生成 *****
                // 式
                j = c_expression2(switch_exp, switch_stm - 3);
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    if (switch_case_stm[switch_case_no] == switch_default_stm) { continue; }
                    code_push("dup", debugpos1, j);
                    j = c_expression2(switch_case_exp[switch_case_no], switch_case_stm[switch_case_no] - 2);
                    code_push("cmpeq", debugpos1, j);
                    code_push("ifgoto", debugpos1, j);
                    code_push('"switch_case_stm' + switch_case_no + '\\' + i + '"', debugpos1, j);
                }
                if (switch_default_stm >= 0) {
                    code_push("goto", debugpos1, j);
                    code_push('"switch_default_stm\\' + i + '"', debugpos1, j);
                } else {
                    code_push("goto", debugpos1, j);
                    code_push('"switch_end\\' + i + '"', debugpos1, j);
                }
                // 文
                for (switch_case_no = 0; switch_case_no < switch_case_exp.length; switch_case_no++) {
                    code_push("label", debugpos1, j);
                    if (switch_case_stm[switch_case_no] == switch_default_stm) {
                        code_push('"switch_default_stm\\' + i + '"', debugpos1, j);
                    } else {
                        code_push('"switch_case_stm' + switch_case_no + '\\' + i + '"', debugpos1, j);
                    }
                    if (switch_case_no < switch_case_exp.length - 1) {
                        switch_case_stm_end = switch_case_exp[switch_case_no + 1];
                    } else {
                        switch_case_stm_end = switch_end;
                    }
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    c_statement(switch_case_stm[switch_case_no], switch_case_stm_end - 1, '"switch_end\\' + i + '"', continue_lbl);
                }
                // 終了
                code_push("label", debugpos1, j);
                code_push('"switch_end\\' + i + '"', debugpos1, j);
                code_push("pop", debugpos1, j);
                i = switch_end;
                continue;
            }

            // ***** if文のとき *****
            // if (式) { 文 } elsif (式) { 文 } ... elsif (式) { 文 } else { 文 }
            if (sym == "if") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                if_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpos2 = j + 1;
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
                        debugpos1 = j; // エラー表示位置調整
                        j++;
                        match2("(", j++);
                        // 式
                        elsif_exp.push(j);
                        k = 1;
                        if (symbol[j] == ")") {
                            debugpos2 = j + 1;
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
                        debugpos1 = j; // エラー表示位置調整
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
                debugpos1 = i - 1; // エラー表示位置調整
                // 式
                j = c_expression2(if_exp, if_stm - 3);
                code_push("ifnotgoto", debugpos1, j);
                if (elsif_exp.length > 0) {
                    code_push('"elsif_exp0\\' + i + '"', debugpos1, j);
                } else if (else_stm >= 0) {
                    code_push('"else_stm\\' + i + '"', debugpos1, j);
                } else {
                    code_push('"if_end\\' + i + '"', debugpos1, j);
                }
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(if_stm, if_stm_end - 1, break_lbl, continue_lbl);
                if (elsif_exp.length > 0 || else_stm >=0) {
                    code_push("goto", debugpos1, j);
                    code_push('"if_end\\' + i + '"', debugpos1, j);
                }
                // elsif
                for (elsif_no = 0; elsif_no < elsif_exp.length; elsif_no++) {
                    // 式
                    code_push("label", debugpos1, j);
                    code_push('"elsif_exp' + elsif_no + '\\' + i + '"', debugpos1, j);
                    j = c_expression2(elsif_exp[elsif_no], elsif_stm[elsif_no] - 3);
                    code_push("ifnotgoto", debugpos1, j);
                    if (elsif_exp.length > elsif_no + 1) {
                        code_push('"elsif_exp' + (elsif_no + 1) + '\\' + i + '"', debugpos1, j);
                    } else if (else_stm >= 0) {
                        code_push('"else_stm\\' + i + '"', debugpos1, j);
                    } else {
                        code_push('"if_end\\' + i + '"', debugpos1, j);
                    }
                    // 文
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    c_statement(elsif_stm[elsif_no], elsif_stm_end[elsif_no] - 1, break_lbl, continue_lbl);
                    if (elsif_exp.length > elsif_no + 1 || else_stm >=0) {
                        code_push("goto", debugpos1, j);
                        code_push('"if_end\\' + i + '"', debugpos1, j);
                    }
                }
                // else
                if (else_stm >= 0) {
                    // 文
                    code_push("label", debugpos1, j);
                    code_push('"else_stm\\' + i + '"', debugpos1, j);
                    // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                    c_statement(else_stm, if_end - 1, break_lbl, continue_lbl);
                }
                // 終了
                code_push("label", debugpos1, j);
                code_push('"if_end\\' + i + '"', debugpos1, j);
                i = if_end;
                continue;
            }

            // ***** for文のとき *****
            // for (式1; 式2; 式3) { 文 }
            if (sym == "for") {
                i++;
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
                if (for_exp1 < for_exp2 - 1) {
                    j = c_expression2(for_exp1, for_exp2 - 2);
                    code_push("pop", debugpos1, j);
                }
                code_push("goto", debugpos1, j);
                code_push('"for_exp2\\' + i + '"', debugpos1, j);
                // 式3
                code_push("label", debugpos1, j);
                code_push('"for_exp3\\' + i + '"', debugpos1, j);
                if (for_exp3 < for_stm - 2) {
                    j = c_expression2(for_exp3, for_stm - 3);
                    code_push("pop", debugpos1, j);
                }
                // 式2
                code_push("label", debugpos1, j);
                code_push('"for_exp2\\' + i + '"', debugpos1, j);
                if (for_exp2 < for_exp3 - 1) {
                    j = c_expression2(for_exp2, for_exp3 - 2);
                } else {
                    code_push("store1", debugpos1, j); // 式2が空なら無限ループ
                }
                code_push("ifnotgoto", debugpos1, j);
                code_push('"for_end\\' + i + '"', debugpos1, j);
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(for_stm, for_end - 1, '"for_end\\' + i + '"', '"for_exp3\\' + i + '"');
                // for (j = for_stm; j < for_end - 1; j++) {
                //     code_push(symbol[j], debugpos1, j);
                // }
                code_push("goto", debugpos1, j);
                code_push('"for_exp3\\' + i + '"', debugpos1, j);
                // 終了
                code_push("label", debugpos1, j);
                code_push('"for_end\\' + i + '"', debugpos1, j);
                i = for_end;
                continue;
            }

            // ***** while文のとき *****
            // while (式) { 文 }
            if (sym == "while") {
                i++;
                // ***** 解析とアドレスの取得 *****
                j = i;
                match2("(", j++);
                // 式
                while_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpos2 = j + 1;
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
                code_push("label", debugpos1, j);
                code_push('"while_exp\\' + i + '"', debugpos1, j);
                j = c_expression2(while_exp, while_stm - 3);
                code_push("ifnotgoto", debugpos1, j);
                code_push('"while_end\\' + i + '"', debugpos1, j);
                // 文
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(while_stm, while_end - 1, '"while_end\\' + i + '"', '"while_exp\\' + i + '"');
                code_push("goto", debugpos1, j);
                code_push('"while_exp\\' + i + '"', debugpos1, j);
                // 終了
                code_push("label", debugpos1, j);
                code_push('"while_end\\' + i + '"', debugpos1, j);
                i = while_end;
                continue;
            }

            // ***** do文のとき *****
            // do { 文 } while (式)
            if (sym == "do") {
                i++;
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
                    debugpos2 = j + 1;
                    throw new Error("do文のwhileがありません。");
                }
                j++;
                match2("(", j++);
                // 式
                do_exp = j;
                k = 1;
                if (symbol[j] == ")") {
                    debugpos2 = j + 1;
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
                code_push("label", debugpos1, j);
                code_push('"do_stm\\' + i + '"', debugpos1, j);
                // ***** 文(ステートメント)のコンパイル(再帰的に実行) *****
                c_statement(do_stm, do_exp - 3, '"do_end\\' + i + '"', '"do_stm\\' + i + '"');
                // 式
                j = c_expression2(do_exp, do_end - 2);
                code_push("ifgoto", debugpos1, j);
                code_push('"do_stm\\' + i + '"', debugpos1, j);
                // 終了
                code_push("label", debugpos1, j);
                code_push('"do_end\\' + i + '"', debugpos1, j);
                i = do_end;
                continue;
            }

            // ***** 式のコンパイル *****
            i = c_expression(i, sym_end);
            code_push("pop", debugpos1, i);
        }
    }

    // ***** 式のコンパイル *****
    // (priorityは演算子の優先順位を表す。大きいほど優先順位が高い)
    function c_expression(sym_start, sym_end, priority) {
        var i, j;
        var sym;
        var tri_flag;

        // ***** 引数のチェック *****
        if (priority == null) { priority = 0; }
        // ***** 因子の処理 *****
        i = sym_start;
        i = c_factor(i, sym_end);
        // ***** 演算子処理のループ *****
        tri_flag = false;
        while (i < sym_end) {
            // ***** シンボル取り出し *****
            // debugpos1 = i;
            sym = symbol[i];
            // ***** 「&」のとき *****
            if (sym == "&" && priority < 10) {
                i++;
                i = c_expression(i, sym_end, 10);
                code_push("and", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「&&」のとき *****
            if (sym == "&&" && priority < 10) {
                j = i;
                i++;
                code_push("ifnotgoto", debugpos1, i);
                code_push('"and_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, sym_end, 9); // 右結合
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
            if (sym == "|" && priority < 10) {
                i++;
                i = c_expression(i, sym_end, 10);
                code_push("or", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 「||」のとき *****
            if (sym == "||" && priority < 10) {
                j = i;
                i++;
                code_push("ifgoto", debugpos1, i);
                code_push('"or_one\\' + j + '"', debugpos1, i);
                i = c_expression(i, sym_end, 9); // 右結合
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
            if (sym == "^" && priority < 10) {
                i++;
                i = c_expression(i, sym_end, 10);
                code_push("xor", debugpos1, i);
                tri_flag = false;
                continue;
            }
            // ***** 3項演算子「?:;」のとき *****
            if (sym == "?" && priority < 10) {
                j = i;
                i++;
                code_push("ifnotgoto", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, sym_end, 9); // 右結合
                match2(":", i++);
                code_push("goto", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                code_push("label", debugpos1, i);
                code_push('"tri_zero\\' + j + '"', debugpos1, i);
                i = c_expression(i, sym_end, 9); // 右結合
                match2(";", i++);
                code_push("label", debugpos1, i);
                code_push('"tri_end\\' + j + '"', debugpos1, i);
                tri_flag = true;
                continue;
            }

            // (3項演算子の処理後は、優先順位10の演算子しか処理しない(過去との互換性維持のため))
            if (tri_flag == true) {
                break;
            }

            // ***** 「<<」のとき *****
            if (sym == "<<" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("shl", debugpos1, i);
                continue;
            }
            // ***** 「<」のとき *****
            if (sym == "<" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmplt", debugpos1, i);
                continue;
            }
            // ***** 「<=」のとき *****
            if (sym == "<=" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmple", debugpos1, i);
                continue;
            }
            // ***** 「>>>」のとき *****
            if (sym == ">>>" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("ushr", debugpos1, i);
                continue;
            }
            // ***** 「>>」のとき *****
            if (sym == ">>" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("shr", debugpos1, i);
                continue;
            }
            // ***** 「>」のとき *****
            if (sym == ">" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmpgt", debugpos1, i);
                continue;
            }
            // ***** 「>=」のとき *****
            if (sym == ">=" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmpge", debugpos1, i);
                continue;
            }
            // ***** 「==」のとき *****
            if (sym == "==" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmpeq", debugpos1, i);
                continue;
            }
            // ***** 「!=」のとき *****
            if (sym == "!=" && priority < 20) {
                i++;
                i = c_expression(i, sym_end, 20);
                code_push("cmpne", debugpos1, i);
                continue;
            }
            // ***** 「+」のとき *****
            if (sym == "+" && priority < 30) {
                i++;
                i = c_expression(i, sym_end, 30);
                code_push("add", debugpos1, i);
                continue;
            }
            // ***** 「.」のとき *****
            if (sym == "." && priority < 30) {
                i++;
                i = c_expression(i, sym_end, 30);
                code_push("addstr", debugpos1, i);
                continue;
            }
            // ***** 「-」のとき *****
            if (sym == "-" && priority < 30) {
                i++;
                i = c_expression(i, sym_end, 30);
                code_push("sub", debugpos1, i);
                continue;
            }
            // ***** 「*」のとき *****
            if (sym == "*" && priority < 40) {
                i++;
                i = c_expression(i, sym_end, 40);
                code_push("mul", debugpos1, i);
                continue;
            }
            // ***** 「/」のとき *****
            if (sym == "/" && priority < 40) {
                i++;
                i = c_expression(i, sym_end, 40);
                code_push("div", debugpos1, i);
                continue;
            }
            // ***** 「\」のとき *****
            if (sym == "\\" && priority < 40) {
                i++;
                i = c_expression(i, sym_end, 40);
                code_push("divint", debugpos1, i);
                continue;
            }
            // ***** 「%」のとき *****
            if (sym == "%" && priority < 40) {
                i++;
                i = c_expression(i, sym_end, 40);
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
    function c_expression2(sym_start, sym_end) {
        var i;

        i = sym_start;
        i = c_expression(i, sym_end);
        while (i < sym_end) {
            if (symbol[i] == ",") {
                i++;
                code_push("pop", debugpos1, i);
                i = c_expression(i, sym_end);
                continue;
            }
            break;
        }
        return i;
    }

    // ***** 因子のコンパイル *****
    function c_factor(sym_start, sym_end) {
        var num;
        var i, j;
        var ch;
        var sym;
        var func_type;
        var func_name;
        var param_num;

        // ***** シンボル取り出し *****
        i = sym_start;
        // debugpos1 = i;
        sym = symbol[i];
        // ***** 「!」のとき *****
        if (sym == "!") {
            j = i;
            i++;
            i = c_factor(i, sym_end);
            code_push("ifnotgoto", debugpos1, i);
            code_push('"not_one\\' + j + '"', debugpos1, i);
            code_push("store0", debugpos1, i);
            code_push("goto", debugpos1, i);
            code_push('"not_end\\' + j + '"', debugpos1, i);
            code_push("label", debugpos1, i);
            code_push('"not_one\\' + j + '"', debugpos1, i);
            code_push("store1", debugpos1, i);
            code_push("label", debugpos1, i);
            code_push('"not_end\\' + j + '"', debugpos1, i);
            return i;
        }
        // ***** 「~」のとき *****
        if (sym == "~") {
            i++;
            i = c_factor(i, sym_end);
            code_push("not", debugpos1, i);
            return i;
        }
        // ***** 「+」のとき *****
        if (sym == "+") {
            i++;
            i = c_factor(i, sym_end);
            return i;
        }
        // ***** 「-」のとき *****
        if (sym == "-") {
            i++;
            i = c_factor(i, sym_end);
            code_push("neg", debugpos1, i);
            return i;
        }
        // ***** 「(」のとき *****
        if (sym == "(") {
            i++;
            i = c_expression2(i, sym_end);
            match2(")", i++);
            return i;
        }
        // ***** アドレス的なもののとき *****
        // ***** (変数名を取得して返す) *****
        if (sym == "&") {
            i++;
            if (symbol[i] == "(") {
                match2("(", i++);
                i = c_getvarname(i, sym_end);
                match2(")", i++);
            } else {
                i = c_getvarname(i, sym_end);
            }
            return i;
        }
        // ***** プレインクリメント(「++」「--」)のとき *****
        if (sym == "++") {
            i++;
            i = c_getvarname(i, sym_end);
            code_push("preinc", debugpos1, i);
            return i;
        }
        if (sym == "--") {
            i++;
            i = c_getvarname(i, sym_end);
            code_push("predec", debugpos1, i);
            return i;
        }

        // ***** 組み込み関数/組み込み変数のとき *****
        if (func_tbl.hasOwnProperty(sym)) { func_type = 1; }
        else if (addfunc_tbl.hasOwnProperty(sym)) { func_type = 2; }
        else { func_type = 0; }
        if (func_type > 0) {
            i++;
            func_name = sym;
            code_push("storestr", debugpos1, i);
            code_push('"' + func_name + '"', debugpos1, i);
            // ***** 組み込み変数のとき *****
            if (func_type == 1 && func_tbl[func_name].param_num == -1) {
                code_push("store0", debugpos1, i);
                code_push("call", debugpos1, i);
                return i;
            }
            if (func_type == 2 && addfunc_tbl[func_name].param_num == -1) {
                code_push("store0", debugpos1, i);
                code_push("calladdfunc", debugpos1, i);
                return i;
            }
            // ***** 組み込み関数のとき *****
            match2("(", i++);
            // ***** 引数の取得 *****
            param_num = 0;
            if (symbol[i] == ")") {
                i++;
            } else {
                while (i < sym_end) {
                    // ***** 「変数名をとる引数」のとき *****
                    if ((func_type == 1 && func_tbl[func_name].param_varname.hasOwnProperty(param_num)) ||
                        (func_type == 2 && addfunc_tbl[func_name].param_varname.hasOwnProperty(param_num))) {
                        i = c_getvarname(i, sym_end);
                    } else {
                        i = c_expression(i, sym_end);
                    }
                    param_num++;
                    if (symbol[i] == ",") {
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
                throw new Error("引数の数が足りません。");
            }
            // ***** 引数の数を設定 *****
            code_push("storenum", debugpos1, i);
            code_push(param_num, debugpos1, i);
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
            // ***** 戻り値を返す *****
            return i;
        }

        // ***** 1文字取り出す *****
        ch = sym.charAt(0);
        // ***** 文字列のとき *****
        if (ch == '"') {
            i++;
            num = sym;
            code_push("storestr", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** 数値のとき *****
        if (isDigit(ch)) {
            i++;
            num = +sym; // 数値にする
            code_push("storenum", debugpos1, i);
            code_push(num, debugpos1, i);
            return i;
        }
        // ***** アルファベットかアンダースコアかポインタのとき *****
        if (isAlpha(ch) || ch == "_" || ch == "*") {

            // ***** 変数名のコンパイル *****
            i = c_getvarname(i, sym_end);

            // ***** 関数のとき *****
            if (symbol[i] == "(") {
                i++;
                // ***** 引数の取得 *****
                param_num = 0;
                if (symbol[i] == ")") {
                    i++;
                } else {
                    while (i < sym_end) {
                        i = c_expression(i, sym_end);
                        param_num++;
                        if (symbol[i] == ",") {
                            i++;
                            continue;
                        }
                        break;
                    }
                    match2(")", i++);
                }
                // ***** 引数の数を設定 *****
                code_push("storenum", debugpos1, i);
                code_push(param_num, debugpos1, i);
                // ***** 関数の呼び出し *****
                code_push("calluser", debugpos1, i);
                // ***** 戻り値を返す *****
                return i;
            }

            // ***** 変数の処理 *****

            // ***** シンボル取り出し *****
            sym = symbol[i];
            // ***** ポストインクリメント(「++」「--」)のとき *****
            if (sym == "++") {
                i++;
                code_push("postinc", debugpos1, i);
                return i;
            }
            if (sym == "--") {
                i++;
                code_push("postdec", debugpos1, i);
                return i;
            }
            // ***** 代入のとき *****
            if (sym == "=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("load", debugpos1, i);
                return i;
            }
            // ***** 複合代入のとき *****
            if (sym == "+=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loadadd", debugpos1, i);
                return i;
            }
            if (sym == "-=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loadsub", debugpos1, i);
                return i;
            }
            if (sym == "*=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loadmul", debugpos1, i);
                return i;
            }
            if (sym == "/=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loaddiv", debugpos1, i);
                return i;
            }
            if (sym == "\\=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loaddivint", debugpos1, i);
                return i;
            }
            if (sym == "%=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loadmod", debugpos1, i);
                return i;
            }
            if (sym == ".=") {
                i++;
                i = c_expression(i, sym_end);
                code_push("loadaddstr", debugpos1, i);
                return i;
            }

            // ***** 変数の値を返す *****
            code_push("store", debugpos1, i);
            return i;
        }
        // ***** 構文エラー *****
        // (一部の構文エラーを発生させない(過去との互換性維持のため))
        if (sym == ")") {
            i++;
            code_push("store0", debugpos1, i);
            return i;
        }
        debugpos2 = i + 1;
        throw new Error("構文エラー 予期しない '" + symbol[i] + "' が見つかりました。");
        // ***** 戻り値を返す *****
        // i++;
        // return i;
    }

    // ***** 変数名のコンパイル(通常用) *****
    function c_getvarname(sym_start, sym_end) {
        var i;
        var var_name;
        var var_name2;

        // ***** 変数名取得 *****
        i = sym_start;
        // debugpos1 = i;
        var_name = symbol[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (変数の内容を変数名にする) *****
        if (var_name == "*") {
            if (symbol[i] == "(") {
                match2("(", i++);
                i = c_getvarname(i, sym_end);
                match2(")", i++);
                code_push("pointer", debugpos1, i);
            } else {
                i = c_getvarname(i, sym_end);
                code_push("pointer", debugpos1, i);
            }
            // (このまま下に降りて変数名の続き(配列の[]等)をサーチする)
        } else {
            // ***** 変数名のチェック *****
            if (!(isAlpha(var_name.charAt(0)) || var_name.charAt(0) == "_")) {
                debugpos2 = i;
                throw new Error("変数名が不正です。('" + var_name + "')");
            }
            // ***** 接頭語のチェック *****
            if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
                var_name2 = symbol[i++];
                if (!(isAlpha(var_name2.charAt(0)) || var_name2.charAt(0) == "_")) {
                    debugpos2 = i;
                    throw new Error("変数名が不正です。('" + var_name2 + "')");
                }
                var_name = var_name.charAt(0) + "\\" + var_name2;
            }
            // ***** 変数名をセット *****
            code_push("storestr", debugpos1, i);
            code_push('"' + var_name + '"', debugpos1, i);
        }
        // ***** 配列変数のとき *****
        while (symbol[i] == "[") {
            i++;
            // i = parseInt(c_expression(i, sym_end), 10);
            i = c_expression(i, sym_end); // 配列の添字に文字列もあり
            match2("]", i++);
            code_push("array", debugpos1, i);
        }
        return i;
    }
    // ***** 変数名のコンパイル2(関数の仮引数用) *****
    function c_getvarname2(sym_start, sym_end, pointer_flag) {
        var i;
        var var_name;
        var var_name2;

        // ***** 引数のチェック *****
        if (pointer_flag == null) { pointer_flag = false; }

        // ***** 変数名取得 *****
        i = sym_start;
        // debugpos1 = i;
        var_name = symbol[i++];

        // ***** ポインタ的なもののとき(文頭の*の前にはセミコロンが必要) *****
        // ***** (実際は*を削っているだけ) *****
        if (var_name == "*") {
            if (symbol[i] == "(") {
                match2("(", i++);
                i = c_getvarname2(i, sym_end, true);
                match2(")", i++);
            } else {
                i = c_getvarname2(i, sym_end, true);
            }
            return i;
        }
        // ***** 変数名のチェック *****
        if (!(isAlpha(var_name.charAt(0)) || var_name.charAt(0) == "_")) {
            debugpos2 = i;
            throw new Error("変数名が不正です。('" + var_name + "')");
        }
        // ***** 接頭語のチェック *****
        if (var_name == "global" || var_name == "glb" || var_name == "local" || var_name == "loc") {
            var_name2 = symbol[i++];
            if (!(isAlpha(var_name2.charAt(0)) || var_name2.charAt(0) == "_")) {
                debugpos2 = i;
                throw new Error("変数名が不正です。('" + var_name2 + "')");
            }
            var_name = var_name.charAt(0) + "\\" + var_name2;
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
        while (symbol[i] == "[") {
            i++;
            // i = parseInt(c_expression(i, sym_end), 10);
            i = c_expression(i, sym_end); // 配列の添字に文字列もあり
            match2("]", i++);
            code_push("array", debugpos1, i);
        }
        return i;
    }

    // ***** コード追加 *****
    function code_push(sym, pos1, pos2) {
        // (命令コードは数値に変換)
        if (opecode.hasOwnProperty(sym)) {
            code[code_len] = opecode[sym];
        // (文字列はダブルクォートを外す)
        } else if (sym.charAt && sym.charAt(0) == '"') {
            if (sym.length >= 2 && sym.charAt(sym.length - 1) == '"') {
                code[code_len] = sym.substring(1, sym.length - 1);
            } else {
                code[code_len] = sym.substring(1);
            }
        // (その他のときはそのまま格納)
        } else {
            code[code_len] = sym;
        }
        // (コード情報にはデバッグ位置の情報を格納)
        code_info[code_len] = {};
        code_info[code_len].pos1 = pos1;
        code_info[code_len].pos2 = pos2;
        // (コード文字列にはそのまま格納)
        code_str[code_len++] = sym;
    }


    // ===== 以下はシンボル初期化処理 =====
    // (ソースを解析してシンボルを生成する)


    // ***** シンボル追加 *****
    function symbol_push(sym, line_no) {
        // symbol.push(sym);
        // symbol_line.push(line_no);
        // symbol_len++;
        symbol[symbol_len] = sym;
        symbol_line[symbol_len++] = line_no;
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

        // ***** ソース解析のループ *****
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
                zero_flag = true;
                if (ch == "0" && isDigit(ch2)) { sym_start = i; } else { zero_flag = false; } // 先頭の0をカット
                while (i < src_len) {
                    ch = src.charAt(i);
                    ch2 = src.charAt(i + 1);
                    if (ch == "." && isDigit(ch2)) { i++; dot_count++; continue; } // 小数点チェック
                    if (isDigit(ch)) { i++; } else { break; }
                    if (zero_flag && ch == "0" && isDigit(ch2)) { sym_start = i; } else { zero_flag = false; } // 先頭の0をカット
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

                // ***** 組み込み定数のとき *****
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
                if (ch2 == ">" && src.charAt(i) == ">") { i++; }
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
        // ***** 終端の追加(安全のため) *****
        symbol_push("end", line_no);
        symbol_push("end", line_no);
        symbol_push("end", line_no);
        symbol_push("end", line_no);
    }


    // ===== 以下は命令の定義処理 =====
    // (各命令の定義情報を生成する)


    // ***** 組み込み関数(戻り値なし)の定義情報の生成 *****
    function make_func_tbl_A() {
        // ***** 組み込み関数(戻り値なし)の定義情報を1個ずつ生成 *****
        // (第2引数は関数の引数の数を指定する(ただし省略可能な引数は数に入れない))
        make_one_func_tbl_A("addfunc", 1, function (param) {
            var a1;

            a1 = parseInt(param[0], 10);
            if (a1 == 0) {
                use_addfunc = false;
            } else {
                use_addfunc = true;
            }
            return true;
        });
        make_one_func_tbl_A("arc", 3, function (param) {
            var a1, a2, a3, a4;
            var i;
            var a, b, x0, y0;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            if (param.length <= 3) {
                a4 = a3;
            } else {
                a4 = parseFloat(param[3]); // H
            }
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
        });
        make_one_func_tbl_A("clear", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = parseInt(param[0], 10); // X
            a2 = parseInt(param[1], 10); // Y
            a3 = parseInt(param[2], 10); // W
            a4 = parseInt(param[3], 10); // H
            ctx.clearRect(a1, a2, a3, a4);
            return true;
        });
        make_one_func_tbl_A("clearkey", 0, function (param) {
            input_buf = [];
            keyinput_buf = [];
            return true;
        });
        make_one_func_tbl_A("clearvar", 0, function (param) {
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
            return true;
        });
        make_one_func_tbl_A("clip", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = parseInt(param[0], 10); // X
            a2 = parseInt(param[1], 10); // Y
            a3 = parseInt(param[2], 10); // W
            a4 = parseInt(param[3], 10); // H

            // ***** Canvasの各設定のリセット2 *****
            reset_canvas_setting2(ctx); // clipを解除する方法がrestoreしかない

            ctx.beginPath();
            ctx.rect(a1, a2, a3, a4);
            ctx.clip();
            return true;
        });
        make_one_func_tbl_A("cls", 0, function (param) {
            // ***** 画面クリア *****
            // ctx.clearRect(-ctx_originx, -ctx_originy, can.width, can.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
            ctx.clearRect(0, 0, can.width, can.height);  // 画面クリア
            set_canvas_axis(ctx);                    // 座標系を再設定
            return true;
        });
        make_one_func_tbl_A("col", 1, function (param) {
            var a1;
            var col_r, col_g, col_b;

            a1 = parseInt(param[0], 10); // RGB
            col_r = (a1 & 0xff0000) >> 16; // R
            col_g = (a1 & 0x00ff00) >> 8;  // G
            col_b = (a1 & 0x0000ff);       // B
            color_val = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            return true;
        });
        make_one_func_tbl_A("color", 3, function (param) {
            var a1, a2, a3;
            var col_r, col_g, col_b;

            a1 = parseInt(param[0], 10); // R
            a2 = parseInt(param[1], 10); // G
            a3 = parseInt(param[2], 10); // B
            col_r = a1;
            col_g = a2;
            col_b = a3;
            color_val = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
            ctx.strokeStyle = color_val;
            ctx.fillStyle = color_val;
            return true;
        });

        make_one_func_tbl_param("copy", 0, 2); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("copy", 5, function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var i_start, i_end, i_plus;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            a3 = getvarname(param[2]);
            a4 = parseInt(param[3], 10);
            a5 = parseInt(param[4], 10);

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
        });

        make_one_func_tbl_param("copyall", 0, 1); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("copyall", 2, function (param) {
            var a1, a2;

            a1 = getvarname(param[0]);
            a2 = getvarname(param[1]);
            // ***** 配列変数の一括コピー *****
            vars.copyArray(a1, a2);
            return true;
        });

        make_one_func_tbl_param("disarray", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("disarray", 1, function (param) {
            var a1, a2, a3;
            var i;

            a1 = getvarname(param[0]);
            if (param.length <= 1) {
                a2 = null;
                a3 = 0;
            } else {
                a2 = parseInt(param[1], 10);
                if (param.length <= 2) {
                    a3 = a2 - 1;
                    a2 = 0;
                } else {
                    a3 = parseInt(param[2], 10);
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
            return true;
        });

        make_one_func_tbl_param("disimg", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("disimg", 1, function (param) {
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                delete imgvars[a1];
            }
            // for (var prop_name in imgvars) { DebugShow(prop_name + " "); } DebugShow("\n");
            return true;
        });

        make_one_func_tbl_param("disvar", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("disvar", 1, function (param) {
            var a1;

            a1 = getvarname(param[0]);
            // delete vars[a1];
            vars.deleteVar(a1);
            return true;
        });

        make_one_func_tbl_param("drawarea", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("drawarea", 7, function (param) {
            var a1, a2, a3, a4, a5, a6, a7;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = parseInt(param[1], 10); // 先X
            a3 = parseInt(param[2], 10); // 先Y
            a4 = parseInt(param[3], 10); // 元X
            a5 = parseInt(param[4], 10); // 元Y
            a6 = parseInt(param[5], 10); // W
            a7 = parseInt(param[6], 10); // H
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
            return true;
        });

        make_one_func_tbl_param("drawimg", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("drawimg", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = parseInt(param[1], 10); // X
            a3 = parseInt(param[2], 10); // Y
            a4 = parseInt(param[3], 10); // アンカー
            if (a1 == "screen") {
                // ***** 水平方向 *****
                // if (a4 & 4) { }                               // 左
                if (a4 & 8)  { a2 = a2 - can1.width; }           // 右
                else if (a4 & 1)  { a2 = a2 - can1.width / 2; }  // 中央
                // else { }                                      // その他
                // ***** 垂直方向 *****
                // if (a4 & 16) { }                              // 上
                if (a4 & 32) { a3 = a3 - can1.height; }          // 下
                else if (a4 & 2)  { a3 = a3 - can1.height / 2; } // 中央
                // else { }                                      // その他
                // ***** 画像を描画(表示画面→ターゲット) *****
                ctx.drawImage(can1, a2, a3);
            } else {
                // if (imgvars.hasOwnProperty(a1)) {
                if (hasOwn.call(imgvars, a1)) {
                    // ***** 水平方向 *****
                    // if (a4 & 4) { }                                          // 左
                    if (a4 & 8)  { a2 = a2 - imgvars[a1].can.width; }           // 右
                    else if (a4 & 1)  { a2 = a2 - imgvars[a1].can.width / 2; }  // 中央
                    // else { }                                                 // その他
                    // ***** 垂直方向 *****
                    // if (a4 & 16) { }                                         // 上
                    if (a4 & 32) { a3 = a3 - imgvars[a1].can.height; }          // 下
                    else if (a4 & 2)  { a3 = a3 - imgvars[a1].can.height / 2; } // 中央
                    // else { }                                                 // その他
                    // ***** 画像を描画(画像変数→ターゲット) *****
                    ctx.drawImage(imgvars[a1].can, a2, a3);
                } else {
                    throw new Error("Image「" + a1 + "」がロードされていません。");
                }
            }
            return true;
        });

        make_one_func_tbl_param("drawscaledimg", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("drawscaledimg", 9, function (param) {
            var a1, a2, a3, a4, a5, a6, a7, a8, a9;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = parseInt(param[1], 10); // 先X
            a3 = parseInt(param[2], 10); // 先Y
            a4 = parseInt(param[3], 10); // 先W
            a5 = parseInt(param[4], 10); // 先H
            a6 = parseInt(param[5], 10); // 元X
            a7 = parseInt(param[6], 10); // 元Y
            a8 = parseInt(param[7], 10); // 元W
            a9 = parseInt(param[8], 10); // 元H
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
            return true;
        });

        make_one_func_tbl_A("farc", 3, function (param) {
            var a1, a2, a3, a4;
            var i;
            var a, b, x0, y0;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            if (param.length <= 3) {
                a4 = a3;
            } else {
                a4 = parseFloat(param[3]); // H
            }
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
        });
        make_one_func_tbl_A("foval", 6, function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var a, b, x0, y0;
            var rad1, rad2;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            a5 = parseFloat(param[4]); // 開始角
            a6 = parseFloat(param[5]); // 描画角
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
        });
        make_one_func_tbl_A("frect", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            ctx.fillRect(a1, a2, a3, a4);
            return true;
        });
        make_one_func_tbl_A("fround", 6, function (param) {
            var a1, a2, a3, a4, a5, a6;
            var rx, ry;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            a5 = parseFloat(param[4]); // RX
            a6 = parseFloat(param[5]); // RY
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
        });

        make_one_func_tbl_param("funccall", 1); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("funccall", 1, function (param) {
            var a1, a2;

            a1 = param[0];
            if (param.length >= 2) {
                a2 = getvarname(param[1]);
                // vars[a2] = a1;
                vars.setVarValue(a2, a1);
            }
            return true;
        });

        make_one_func_tbl_A("gc", 0, function (param) {
            // ***** NOP *****
            return true;
        });
        make_one_func_tbl_A("line", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = parseFloat(param[0]); // X1
            a2 = parseFloat(param[1]); // Y1
            a3 = parseFloat(param[2]); // X2
            a4 = parseFloat(param[3]); // Y2
            ctx.beginPath();
            ctx.moveTo(a1, a2);
            ctx.lineTo(a3, a4);
            ctx.stroke();
            return true;
        });
        make_one_func_tbl_A("linewidth", 1, function (param) {
            var a1;

            a1 = parseFloat(param[0]); // W
            line_width = a1;
            ctx.lineWidth = line_width;
            return true;
        });

        make_one_func_tbl_param("loadimg", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("loadimg", 2, function (param) {
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
            return true;
        });

        make_one_func_tbl_param("loadimgdata", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("loadimgdata", 2, function (param) {
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
            return true;
        });

        make_one_func_tbl_A("lock", 0, function (param) {
            // ***** NOP *****
            return true;
        });

        make_one_func_tbl_param("makearray", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("makearray", 2, function (param) {
            var a1, a2, a3, a4;
            var i;

            a1 = getvarname(param[0]);
            a2 = parseInt(param[1], 10);
            if (param.length <= 2) {
                a3 = a2 - 1;
                a2 = 0;
                a4 = 0;
            } else {
                a3 = parseInt(param[2], 10);
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
            return true;
        });

        make_one_func_tbl_param("makeimg", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("makeimg", 3, function (param) {
            var a1, a2, a3;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            a2 = parseInt(param[1], 10); // W
            a3 = parseInt(param[2], 10); // H

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
            return true;
        });

        make_one_func_tbl_A("msgdlg", 1, function (param) {
            var a1;

            a1 = String(param[0]);
            if (param.length >= 2) {
                a1 = String(param[1]);
            }
            alert(a1);
            keyclear();
            mousebuttonclear();
            loop_nocount_flag = true;
            return true;
        });
        make_one_func_tbl_A("onlocal", 0, function (param) {
            use_local_vars = true;
            return true;
        });
        make_one_func_tbl_A("offlocal", 0, function (param) {
            use_local_vars = false;
            return true;
        });
        make_one_func_tbl_A("origin", 2, function (param) {
            var a1, a2;

            a1 = parseInt(param[0], 10); // X
            a2 = parseInt(param[1], 10); // Y
            // ***** 座標系の原点座標設定 *****
            ctx_originx = a1;
            ctx_originy = a2;
            ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
            set_canvas_axis(ctx);                    // 座標系を再設定
            return true;
        });
        make_one_func_tbl_A("oval", 6, function (param) {
            var a1, a2, a3, a4, a5, a6;
            var i;
            var a, b, x0, y0;
            var rad1, rad2;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            a5 = parseFloat(param[4]); // 開始角
            a6 = parseFloat(param[5]); // 描画角
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
        });
        make_one_func_tbl_A("point", 2, function (param) {
            var a1, a2;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            ctx.fillRect(a1, a2, 1, 1);
            return true;
        });
        make_one_func_tbl_A("rect", 4, function (param) {
            var a1, a2, a3, a4;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            ctx.beginPath();
            ctx.rect(a1, a2, a3, a4);
            ctx.stroke();
            return true;
        });
        make_one_func_tbl_A("rotate", 1, function (param) {
            var a1, a2, a3;

            a1 = parseFloat(param[0]); // 角度
            if (param.length <= 2) {
                a2 = 0;
                a3 = 0;
            } else {
                a2 = parseFloat(param[1]); // 中心座標X
                a3 = parseFloat(param[2]); // 中心座標Y
            }
            // ***** 座標系の角度設定 *****
            ctx_rotate = a1 * Math.PI / 180;
            ctx_rotateox = a2;
            ctx_rotateoy = a3;
            ctx.setTransform(1, 0, 0, 1, 0, 0);      // 座標系を元に戻す
            set_canvas_axis(ctx);                    // 座標系を再設定
            return true;
        });
        make_one_func_tbl_A("round", 6, function (param) {
            var a1, a2, a3, a4, a5, a6;
            var rx, ry;

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            a3 = parseFloat(param[2]); // W
            a4 = parseFloat(param[3]); // H
            a5 = parseFloat(param[4]); // RX
            a6 = parseFloat(param[5]); // RY
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
        });
        make_one_func_tbl_A("save", 1, function (param) {
            var a1, a2;

            a1 = String(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = parseInt(param[0], 10);
            }
            save_data[a2] = a1;
            return true;
        });
        make_one_func_tbl_A("scale", 1, function (param) {
            var a1, a2, a3, a4;

            a1 = parseFloat(param[0]); // X方向倍率
            if (param.length <= 1) {
                a2 = a1;
                a3 = 0;
                a4 = 0;
            } else {
                a2 = parseFloat(param[1]); // Y方向倍率
                if (param.length <= 3) {
                    a3 = 0;
                    a4 = 0;
                } else {
                    a3 = parseFloat(param[2]); // 中心座標X
                    a4 = parseFloat(param[3]); // 中心座標Y
                }
            }
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
        });
        make_one_func_tbl_A("setfont", 1, function (param) {
            var a1;

            a1 = String(param[0]).toUpperCase();
            switch (a1) {
                case "L": font_size = 30; break;
                case "M": font_size = 24; break;
                case "S": font_size = 16; break;
                case "T": font_size = 12; break;
                default: font_size = 24; break;
            }
            ctx.font = font_size + "px " + font_family;
            return true;
        });
        make_one_func_tbl_A("setoutdata", 2, function (param) {
            var a1, a2;

            a1 = parseInt(param[0], 10);
            a2 = String(param[1]);
            out_data[a1] = a2;
            return true;
        });
        make_one_func_tbl_A("setpixel", 3, function (param) {
            var a1, a2, a3;
            var col_r, col_g, col_b;

            a1 = parseFloat(param[0]);   // X
            a2 = parseFloat(param[1]);   // Y
            a3 = parseInt(param[2], 10); // RGB
            col_r = (a3 & 0xff0000) >> 16; // R
            col_g = (a3 & 0x00ff00) >> 8;  // G
            col_b = (a3 & 0x0000ff);       // B
            ctx.fillStyle = "rgb(" + col_r + "," + col_g + "," + col_b + ")";
            ctx.fillRect(a1, a2, 1, 1);
            ctx.fillStyle = color_val;
            return true;
        });
        make_one_func_tbl_A("setscsize", 2, function (param) {
            var a1, a2, a3, a4;

            a1 = parseInt(param[0], 10); // W
            a2 = parseInt(param[1], 10); // H
            if (param.length <= 3) {
                a3 = a1;
                a4 = a2;
            } else {
                a3 = parseInt(param[2], 10); // W2
                a4 = parseInt(param[3], 10); // H2
            }
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
        });
        make_one_func_tbl_A("sleep", 1, function (param) {
            var a1;

            a1 = parseInt(param[0], 10);
            sleep_flag = true;
            sleep_time = a1;
            return true;
        });
        make_one_func_tbl_A("soft1", 1, function (param) {
            var a1;

            a1 = String(param[0]);
            softkey[0] = a1;
            disp_softkey();
            return true;
        });
        make_one_func_tbl_A("soft2", 1, function (param) {
            var a1;

            a1 = String(param[0]);
            softkey[1] = a1;
            disp_softkey();
            return true;
        });
        make_one_func_tbl_A("spmode", 1, function (param) {
            var a1;

            a1 = parseInt(param[0], 10);
            sp_compati_mode = a1;
            if (sp_compati_mode == 1) {
                font_size = 12;
                ctx.font = font_size + "px " + font_family;
                use_local_vars = false;
            }
            return true;
        });
        make_one_func_tbl_A("text", 1, function (param) {
            var a1, a2, a3, a4;

            // ***** 文字列に変換 *****
            // a1 = param[0];
            a1 = String(param[0]);

            // ***** Chrome v24 で全角スペースが半角のサイズで表示される件の対策 *****
            a1 = a1.replace(/　/g, "  "); // 全角スペースを半角スペース2個に変換

            if (param.length <= 3) {
                a2 = a3 = a4 = 0;
            } else {
                a2 = parseInt(param[1], 10); // X
                a3 = parseInt(param[2], 10); // Y
                a4 = parseInt(param[3], 10); // アンカー
            }
            // ***** 水平方向 *****
            if (a4 & 4)       { ctx.textAlign = "left"; }    // 左
            else if (a4 & 8)  { ctx.textAlign = "right"; }   // 右
            else if (a4 & 1)  { ctx.textAlign = "center"; }  // 中央
            else { ctx.textAlign = "left"; }                 // その他
            // ***** 垂直方向 *****
            if (a4 & 16)      { ctx.textBaseline = "top"; }        // 上
            else if (a4 & 32) { ctx.textBaseline = "bottom"; }     // 下
            else if (a4 & 2)  { ctx.textBaseline = "middle"; }     // 中央
            else if (a4 & 64) { ctx.textBaseline = "alphabetic"; } // ベースライン
            else { ctx.textBaseline = "top"; }                     // その他
            // ***** 文字列表示 *****
            ctx.fillText(a1, a2, a3);
            return true;
        });

        make_one_func_tbl_param("trgt", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("trgt", 1, function (param) {
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
            return true;
        });

        make_one_func_tbl_A("unlock", 0, function (param) {
            var a1;

            if (param.length <= 0) {
                a1 = 0;
            } else {
                a1 = parseInt(param[0], 10);
            }
            // ***** NOP *****
            return true;
        });

        make_one_func_tbl_param("@", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_A("@", 1, function (param) {
            var a1, a2;
            var i;

            a1 = getvarname(param[0]);
            for (i = 1; i < param.length; i++) {
                a2 = param[i];
                // vars[a1 + "[" + (i - 1) + "]"] = a2;
                vars.setVarValue(a1 + "[" + (i - 1) + "]", a2);
            }
            return true;
        });
    }


    // ***** 組み込み関数(戻り値あり)の定義情報の生成 *****
    function make_func_tbl_B() {
        // ***** 組み込み関数(戻り値あり)の定義情報を1個ずつ生成 *****
        // (第2引数は関数の引数の数を指定する(ただし省略可能な引数は数に入れない))
        // (第2引数を-1にすると組み込み変数になり、()なしで呼び出せる)
        make_one_func_tbl_B("abs", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.abs(a1);
            return num;
        });
        make_one_func_tbl_B("acos", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.acos(a1) * 180 / Math.PI;
            return num;
        });

        make_one_func_tbl_param("arraylen", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("arraylen", 1, function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = getvarname(param[0]);
            if (param.length <= 1) {
                a2 = 0;
                a3 = null;
            } else {
                a2 = parseInt(param[1], 10);
                if (param.length <= 2) {
                    a3 = null;
                } else {
                    a3 = parseInt(param[2], 10);
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
        make_one_func_tbl_B("asin", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.asin(a1) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl_B("atan", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.atan(a1) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl_B("atan2", 2, function (param) {
            var num;
            var a1, a2;

            a1 = parseFloat(param[0]);
            a2 = parseFloat(param[1]);
            // num = Math.atan2(a2, a1) * 180 / Math.PI;
            num = Math.atan2(a1, a2) * 180 / Math.PI;
            return num;
        });
        make_one_func_tbl_B("ceil", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.ceil(a1);
            return num;
        });
        make_one_func_tbl_B("cos", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            if (sp_compati_mode == 1) {
                num = parseInt(Math.cos(a1 * Math.PI / 180) * 100, 10);
            } else {
                num = Math.cos(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl_B("day", -1, function (param) {
            var num;

            num = new Date().getDate();
            return num;
        });
        make_one_func_tbl_B("dayofweek", -1, function (param) {
            var num;

            num = new Date().getDay(); // =0:日曜日,=1:月曜日 ... =6:土曜日
            return num;
        });
        make_one_func_tbl_B("dcos", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.cos(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl_B("download", 1, function (param) {
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
                    a3 = parseInt(param[2], 10);
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
        make_one_func_tbl_B("downloadimg", 0, function (param) {
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
                    a2 = parseInt(param[1], 10);
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
        make_one_func_tbl_B("dpow", 2, function (param) {
            var num;
            var a1, a2;

            a1 = parseFloat(param[0]);
            a2 = parseFloat(param[1]);
            num = Math.pow(a1, a2);
            return num;
        });
        make_one_func_tbl_B("dsin", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.sin(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl_B("dtan", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.tan(a1 * Math.PI / 180);
            return num;
        });
        make_one_func_tbl_B("exp", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.exp(a1);
            return num;
        });
        make_one_func_tbl_B("floor", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.floor(a1);
            return num;
        });
        make_one_func_tbl_B("getoutdata", 1, function (param) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            if (out_data.hasOwnProperty(a1)) { num = out_data[a1]; } else { num = ""; }
            return num;
        });
        make_one_func_tbl_B("getpixel", 2, function (param) {
            var num;
            var a1, a2;
            var x1, y1;
            var ret_obj = {};
            var img_data = {};

            a1 = parseFloat(param[0]); // X
            a2 = parseFloat(param[1]); // Y
            // ***** 座標系の変換の分を補正 *****
            ret_obj = {};
            conv_axis_point(a1, a2, ret_obj);
            x1 = ret_obj.x;
            y1 = ret_obj.y;
            // ***** エラーチェック *****
            // if (x1 < 0 || x1 >= can.width || y1 < 0 || y1 >= can.height) { return 0; }
            if (!(x1 >= 0 && x1 < can.width && y1 >= 0 && y1 < can.height)) { return 0; }
            // ***** 画像データを取得 *****
            img_data = ctx.getImageData(x1, y1, 1, 1);
            // ***** 色情報を取得 *****
            num = (img_data.data[0] << 16) | (img_data.data[1] << 8) | img_data.data[2];
            return num;
        });
        make_one_func_tbl_B("height", -1, function (param) {
            var num;

            num = can1.height;
            return num;
        });
        make_one_func_tbl_B("hour", -1, function (param) {
            var num;

            num = new Date().getHours();
            return num;
        });

        make_one_func_tbl_param("imgheight", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("imgheight", 1, function (param) {
            var num;
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                num = imgvars[a1].can.height;
            } else { num = 0; }
            return num;
        });

        make_one_func_tbl_param("imgwidth", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("imgwidth", 1, function (param) {
            var num;
            var a1;

            a1 = toglobal(getvarname(param[0])); // 画像変数名取得
            // if (imgvars.hasOwnProperty(a1)) {
            if (hasOwn.call(imgvars, a1)) {
                num = imgvars[a1].can.width;
            } else { num = 0; }
            return num;
        });

        make_one_func_tbl_B("index", 2, function (param) {
            var num;
            var a1, a2, a3;

            a1 = String(param[0]);
            a2 = String(param[1]);
            if (param.length <= 2) {
                a3 = 0;
            } else {
                a3 = parseInt(param[2], 10);
            }
            num = a1.indexOf(a2, a3);
            return num;
        });
        make_one_func_tbl_B("input", 0, function (param) {
            var num;
            var a1;
            var repeat_flag;

            if (param.length <= 0) {
                a1 = 0;
                repeat_flag = true;
            } else {
                a1 = parseInt(param[0], 10);
                repeat_flag = false;
            }
            // ***** キー入力ありのとき *****
            if (input_buf.length > 0) {
                input_flag = false;
                num = input_buf.shift();
                return num;
            }
            // ***** キー入力なしのとき *****
            if (repeat_flag) {
                input_flag = true;
                sleep_flag = true;
                sleep_time = 1000;
                return 0;
            }
            if (a1 > 0 && !input_flag) {
                input_flag = true;
                sleep_flag = true;
                sleep_time = a1;
                return 0;
            }
            input_flag = false;
            return 0;
        });
        make_one_func_tbl_B("inputdlg", 1, function (param) {
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
                    a3 = parseInt(param[2], 10); // 未使用
                    a4 = parseInt(param[3], 10); // 未使用
                }
            }
            num = prompt(a1, a2) || ""; // nullのときは空文字列にする
            keyclear();
            mousebuttonclear();
            loop_nocount_flag = true;
            return num;
        });
        make_one_func_tbl_B("int", 1, function (param) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            num = a1;
            return num;
        });

        make_one_func_tbl_param("join", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("join", 2, function (param) {
            var num;
            var a1, a2, a3, a4;
            var i;

            a1 = getvarname(param[0]);
            a2 = String(param[1]);
            if (param.length <= 2) {
                a3 = 0;
                a4 = null;
            } else {
                a3 = parseInt(param[2], 10);
                if (param.length <= 3) {
                    a4 = null;
                } else {
                    a4 = parseInt(param[3], 10);
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

        // make_one_func_tbl_B("keydown", -1, function (param) { // 名前がキー定数とかぶったため変更
        make_one_func_tbl_B("keydowncode", -1, function (param) {
            var num;

            num = key_down_code;
            return num;
        });
        make_one_func_tbl_B("keyinput", 0, function (param) {
            var num;
            var a1;
            var repeat_flag;

            if (param.length <= 0) {
                a1 = 0;
                repeat_flag = true;
            } else {
                a1 = parseInt(param[0], 10);
                repeat_flag = false;
            }
            // ***** キー入力ありのとき *****
            if (keyinput_buf.length > 0) {
                keyinput_flag = false;
                num = keyinput_buf.shift();
                return num;
            }
            // ***** キー入力なしのとき *****
            if (repeat_flag) {
                keyinput_flag = true;
                sleep_flag = true;
                sleep_time = 1000;
                return 0;
            }
            if (a1 > 0 && !keyinput_flag) {
                keyinput_flag = true;
                sleep_flag = true;
                sleep_time = a1;
                return 0;
            }
            keyinput_flag = false;
            return 0;
        });
        make_one_func_tbl_B("keyscan", 1, function (param) {
            var num;
            var a1;

            a1 = parseInt(param[0], 10);
            if (key_down_stat[a1] == true) { num = 1; } else { num = 0; }
            return num;
        });
        make_one_func_tbl_B("keypress", -1, function (param) {
            var num;

            num = key_press_code;
            return num;
        });
        make_one_func_tbl_B("load", 0, function (param) {
            var num;
            var a1;

            if (param.length <= 0) {
                a1 = 0;
            } else {
                a1 = parseInt(param[0], 10);
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

        make_one_func_tbl_param("loadimgstat", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("loadimgstat", 1, function (param) {
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

        make_one_func_tbl_B("log", 1, function (param) {
            var num;
            var a1, a2;

            a1 = parseFloat(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = parseFloat(param[1]);
            }
            if (a2 == 0) {
                num = Math.log(a1);
            } else {
                num = Math.log(a1) / Math.log(a2);
            }
            return num;
        });
        make_one_func_tbl_B("max", 2, function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = parseFloat(param[0]);
            a2 = parseFloat(param[1]);
            num = Math.max(a1, a2);
            for (i = 2; i < param.length; i++) {
                a3 = parseFloat(param[i]);
                num = Math.max(num, a3);
            }
            return num;
        });
        make_one_func_tbl_B("millisecond", -1, function (param) {
            var num;

            num = new Date().getMilliseconds();
            return num;
        });
        make_one_func_tbl_B("min", 2, function (param) {
            var num;
            var a1, a2, a3;
            var i;

            a1 = parseFloat(param[0]);
            a2 = parseFloat(param[1]);
            num = Math.min(a1, a2);
            for (i = 2; i < param.length; i++) {
                a3 = parseFloat(param[i]);
                num = Math.min(num, a3);
            }
            return num;
        });
        make_one_func_tbl_B("minute", -1, function (param) {
            var num;

            num = new Date().getMinutes();
            return num;
        });
        make_one_func_tbl_B("month", -1, function (param) {
            var num;

            num = new Date().getMonth() + 1; // 1から12にするため1を加算
            return num;
        });
        make_one_func_tbl_B("mousex", -1, function (param) {
            var num;

            num = mousex;
            return num;
        });
        make_one_func_tbl_B("mousey", -1, function (param) {
            var num;

            num = mousey;
            return num;
        });
        make_one_func_tbl_B("mousebtn", -1, function (param) {
            var num;

            num = 0;
            if (mouse_btn_stat[0] == true) { num = num | 1; }        // 左ボタン
            if (mouse_btn_stat[1] == true) { num = num | (1 << 2); } // 中ボタン(シフト値1でないので注意)
            if (mouse_btn_stat[2] == true) { num = num | (1 << 1); } // 右ボタン(シフト値2でないので注意)
            return num;
        });
        make_one_func_tbl_B("pow", 2, function (param) {
            var num;
            var a1, a2;

            a1 = parseFloat(param[0]);
            a2 = parseFloat(param[1]);
            num = Math.pow(a1, a2);
            return num;
        });
        make_one_func_tbl_B("PI", -1, function (param) {
            var num;

            num = Math.PI;
            return num;
        });
        make_one_func_tbl_B("rand", -1, function (param) {
            var num;

            // min から max までの整数の乱数を返す
            // (Math.round() を用いると、非一様分布になるのでNG)
            // num = Math.floor(Math.random() * (max - min + 1)) + min;
            num = Math.floor(Math.random() * (2147483647 - (-2147483648) + 1)) + (-2147483648);
            return num;
        });
        make_one_func_tbl_B("random", -1, function (param) {
            var num;

            num = Math.random();
            return num;
        });
        make_one_func_tbl_B("replace", 3, function (param) {
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
                a4 = parseInt(param[3], 10);
                if (param.length <= 4) {
                    a5 = -1;
                } else {
                    a5 = parseInt(param[4], 10);
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
        make_one_func_tbl_B("scan", -1, function (param) {
            var num;

            num = key_scan_stat;
            return num;
        });
        make_one_func_tbl_B("second", -1, function (param) {
            var num;

            num = new Date().getSeconds();
            return num;
        });
        make_one_func_tbl_B("setscl", 1, function (param) {
            var num;
            var a1, a2, a3;

            a1 = parseFloat(param[0]);
            if (param.length <= 1) {
                a2 = 0;
            } else {
                a2 = parseFloat(param[1]);
            }
            a3 = Math.pow(10, a2);
            num = Math.round(a1 * a3) / a3;
            return num;
        });
        make_one_func_tbl_B("sin", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            if (sp_compati_mode == 1) {
                num = parseInt(Math.sin(a1 * Math.PI / 180) * 100, 10);
            } else {
                num = Math.sin(a1 * Math.PI / 180);
            }
            return num;
        });

        make_one_func_tbl_param("split", 0); // 「変数名をとる引数」を指定
        make_one_func_tbl_B("split", 3, function (param) {
            var num;
            var a1, a2, a3, a4;
            var i, j, k;

            a1 = getvarname(param[0]);
            a2 = String(param[1]);
            a3 = String(param[2]);
            if (param.length <= 3) {
                a4 = 0;
            } else {
                a4 = parseInt(param[3], 10);
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

        make_one_func_tbl_B("spweb", -1, function (param) {
            var num;

            num = 1;
            return num;
        });
        make_one_func_tbl_B("sqrt", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            num = Math.sqrt(a1);
            return num;
        });
        make_one_func_tbl_B("sthigh", -1, function (param) {
            var num;

            num = font_size;
            return num;
        });
        make_one_func_tbl_B("strat", 2, function (param) {
            var num;
            var a1, a2;

            a1 = String(param[0]);
            a2 = parseInt(param[1], 10);
            num = a1.charAt(a2);
            return num;
        });
        make_one_func_tbl_B("strlen", 1, function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.length;
            return num;
        });
        make_one_func_tbl_B("stwide", 1, function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = ctx.measureText(a1).width;
            return num;
        });
        make_one_func_tbl_B("substr", 2, function (param) {
            var num;
            var a1, a2, a3;

            a1 = String(param[0]);
            a2 = parseInt(param[1], 10);
            if (param.length <= 2) {
                a3 = a1.length - a2;
            } else {
                a3 = parseInt(param[2], 10);
            }
            num = a1.substring(a2, a2 + a3);
            return num;
        });
        make_one_func_tbl_B("tan", 1, function (param) {
            var num;
            var a1;

            a1 = parseFloat(param[0]);
            if (sp_compati_mode == 1) {
                num = parseInt(Math.tan(a1 * Math.PI / 180) * 100, 10);
            } else {
                num = Math.tan(a1 * Math.PI / 180);
            }
            return num;
        });
        make_one_func_tbl_B("tick", -1, function (param) {
            var num;

            // num = new Date().getTime();
            num = Date.now();
            return num;
        });
        make_one_func_tbl_B("trim", 1, function (param) {
            var num;
            var a1;

            a1 = String(param[0]);
            num = a1.replace(/^\s+|\s+$/g,"");
            return num;
        });
        make_one_func_tbl_B("width", -1, function (param) {
            var num;

            num = can1.width;
            return num;
        });
        make_one_func_tbl_B("year", -1, function (param) {
            var num;

            num = new Date().getFullYear();
            return num;
        });
        make_one_func_tbl_B("yndlg", 1, function (param) {
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
    }


    // ***** 組み込み関数(戻り値なし)の定義情報1個の生成 *****
    function make_one_func_tbl_A(name, param_num, func) {
        // (定義情報1個の生成)
        if (!func_tbl[name]) { func_tbl[name] = {}; }
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        func_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        if (!func_tbl[name].param_varname) { func_tbl[name].param_varname = {}; }
        // (戻り値の有無を設定)
        func_tbl[name].use_retval = false;
        // (関数の本体を設定)
        func_tbl[name].func = func;
    }
    // ***** 組み込み関数(戻り値あり)の定義情報1個の生成 *****
    function make_one_func_tbl_B(name, param_num, func) {
        // (定義情報1個の生成)
        if (!func_tbl[name]) { func_tbl[name] = {}; }
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        // (これを-1にすると組み込み変数になり、()なしで呼び出せる)
        func_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        if (!func_tbl[name].param_varname) { func_tbl[name].param_varname = {}; }
        // (戻り値の有無を設定)
        func_tbl[name].use_retval = true;
        // (関数の本体を設定)
        func_tbl[name].func = func;
    }
    // ***** 組み込み関数のx番目の引数が「変数名をとる引数」であることを指定する *****
    // ***** (xは第2引数で指定する(複数あるときは第3引数以後も使って指定する)) *****
    function make_one_func_tbl_param(name) {
        var i;
        if (!func_tbl[name]) { func_tbl[name] = {}; }
        func_tbl[name].param_varname = {};
        for (i = 1; i < arguments.length; i++) {
            func_tbl[name].param_varname[arguments[i]] = true;
        }
    }


    // ===== 以下は追加命令用の処理 =====
    // (追加命令の定義情報を生成するための関数等)


    // ***** 追加の組み込み関数(戻り値なし)の定義情報1個の生成 *****
    function add_one_func_tbl_A(name, param_num, func) {
        // (定義情報1個の生成)
        if (!addfunc_tbl[name]) { addfunc_tbl[name] = {}; }
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        addfunc_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        if (!addfunc_tbl[name].param_varname) { addfunc_tbl[name].param_varname = {}; }
        // (戻り値の有無を設定)
        addfunc_tbl[name].use_retval = false;
        // (関数の本体を設定)
        addfunc_tbl[name].func = func;
    }
    // ***** 追加の組み込み関数(戻り値あり)の定義情報1個の生成 *****
    function add_one_func_tbl_B(name, param_num, func) {
        // (定義情報1個の生成)
        if (!addfunc_tbl[name]) { addfunc_tbl[name] = {}; }
        // (引数の数を設定(ただし省略可能な引数は数に入れない))
        // (これを-1にすると組み込み変数になり、()なしで呼び出せる)
        addfunc_tbl[name].param_num = param_num;
        // (「変数名をとる引数」の指定フラグを生成)
        if (!addfunc_tbl[name].param_varname) { addfunc_tbl[name].param_varname = {}; }
        // (戻り値の有無を設定)
        addfunc_tbl[name].use_retval = true;
        // (関数の本体を設定)
        addfunc_tbl[name].func = func;
    }
    // ***** 追加の組み込み関数のx番目の引数が「変数名をとる引数」であることを指定する *****
    // ***** (xは第2引数で指定する(複数あるときは第3引数以後も使って指定する)) *****
    function add_one_func_tbl_param(name) {
        var i;
        if (!addfunc_tbl[name]) { addfunc_tbl[name] = {}; }
        addfunc_tbl[name].param_varname = {};
        for (i = 1; i < arguments.length; i++) {
            addfunc_tbl[name].param_varname[arguments[i]] = true;
        }
    }

    // ***** プラグイン用 *****
    // (必要に応じてインタープリターの内部情報を公開する)
    Interpreter.add_before_run_funcs = function (name, func) { before_run_funcs[name] = func; };
    Interpreter.add_after_run_funcs = function (name, func) { after_run_funcs[name] = func; };
    Interpreter.add_clear_var_funcs = function (name, func) { clear_var_funcs[name] = func; };
    Interpreter.add_one_func_tbl_A = add_one_func_tbl_A;
    Interpreter.add_one_func_tbl_B = add_one_func_tbl_B;
    Interpreter.add_one_func_tbl_param = add_one_func_tbl_param;
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
    // ***** (staticなクラスなので未使用) *****
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
    // ***** (staticなメソッドなのでprototype未使用) *****
    // Download.prototype.download = function (data, fname) {
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
    // ***** (staticなメソッドなのでprototype未使用) *****
    Download.downloadCanvas = function (can, fname) {
        var url;
        var blob;
        var elm, ev;
        var link_download_flag;
        var i;
        var data_url;
        var bin_st;      // バイナリデータ文字列
        var bin_st_len;  // バイナリデータ文字列の長さ
        var uint8_arr;   // バイナリデータ(型付配列)

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
                " total="       + time_total + "(msec) mean=" + time_mean +
                "(msec) max="   + time_max   + "(msec) min="  + time_min  + "(msec)";
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


