#!/usr/bin/env python
# -*- coding:utf-8 -*-

import os
import datetime
import urllib

# webapp2 を Flask に変更
#import webapp2
from flask import Flask, render_template, request, redirect

# jinja2 は Flask に含まれるので削除
#import jinja2

import logging

# GAEの互換用設定を追加
from google.appengine.api import wrap_wsgi_app

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import search
from google.appengine.api import capabilities

# databook.py
# 2024-5-7 v1.52

# Google App Engine / Python による データベース アプリケーション1

# ****************************************
#               初期設定等
# ****************************************

# ***** 定数の設定 *****
mainpage_show_num = 50 # メインページの表示件数
backup_num = 10        # 記事のバックアップ件数
backup_time = 10       # 記事のバックアップを1件に統合する時間(分)

# ***** URLの設定 *****
mainpage_url  = '/databook'
runpage_url   = '/databook/run'
editpage_url  = '/databook/edit'
update_url    = '/databook/update'

# ***** HTMLファイル名の設定 *****
mainpage_html = 'index.html'
runpage_html  = 'sp_interpreter_svr.html'
editpage_html = 'edit.html'


# ***** データベース関係 *****
# データブックの名前と表示タイトルの設定
databook_name_list = {
    'Databook1':'データベース(S)',
    'Databook2':'データベース２(S)',
    'Databook3':'データベース３(S)',
    'Databook4':'データベース４(S)',
    'Databook5':'データベース５(S)'}

# データブックの名前を取得する
def get_databook_name(req_databook_name):
    #if not databook_name_list.has_key(req_databook_name):
    if req_databook_name not in databook_name_list:
        databook_name = 'Databook1'
    else:
        databook_name = req_databook_name
    return databook_name

# データブックの表示タイトルを取得する
def get_databook_title(req_databook_name):
    #if not databook_name_list.has_key(req_databook_name):
    if req_databook_name not in databook_name_list:
        databook_title = databook_name_list['Databook1']
    else:
        databook_title = databook_name_list[req_databook_name]
    return databook_title

# 全文検索用インデックスの名前を取得する
def get_databook_indexname(req_databook_name):
    #if not databook_name_list.has_key(req_databook_name):
    if req_databook_name not in databook_name_list:
        databook_indexname = 'Databook1_Index'
    else:
        databook_indexname = req_databook_name + '_Index'
    return databook_indexname


# ***** データベースの定義 *****

# We set a parent key on the 'Articles' to ensure that they are all in the same
# entity group. Queries across the single entity group will be consistent.
# However, the write rate should be limited to ~1/second.

# 記事(Article)の親エンティティ(Databook)の名前を指定してキーを取得する
def databook_key(databook_name='Databook1'):
    return ndb.Key('Databook', databook_name)

# 記事(Article)のエンティティモデルの定義
class Article(ndb.Model):
    title = ndb.StringProperty()
    # author = ndb.UserProperty()
    author = ndb.StringProperty()
    # content = ndb.StringProperty(indexed=False)
    content = ndb.StringProperty()
    source = ndb.TextProperty()
    # date = ndb.DateTimeProperty(auto_now_add=True)
    date = ndb.DateTimeProperty()
    bkup_authors = ndb.StringProperty(repeated=True)
    bkup_contents = ndb.StringProperty(repeated=True)
    # bkup_sources = ndb.StringProperty(repeated=True)
    bkup_sources = ndb.TextProperty(repeated=True)
    bkup_dates = ndb.DateTimeProperty(repeated=True)
    bkup_lastupdate = ndb.DateTimeProperty()
    # 全文検索用ドキュメントID
    search_doc_id = ndb.StringProperty()
    # 表示フラグ
    show_flag = ndb.IntegerProperty()


# ***** Flaskライブラリの設定 *****
app = Flask(__name__, template_folder = '')
app.wsgi_app = wrap_wsgi_app(app.wsgi_app)


# ***** jinja2ライブラリの設定 *****
#jinja_environment = jinja2.Environment(
#    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
#    extensions=['jinja2.ext.autoescape'])


# ***** ローカル日時変換用(日本は+9時間) *****
class UTC(datetime.tzinfo):
    def tzname(self, dt):
        return 'UTC'
    def utcoffset(self, dt):
        return datetime.timedelta(0)
    def dst(self, dt):
        return datetime.timedelta(0)
class JapanTZ(datetime.tzinfo):
    def tzname(self, dt):
        return 'JST'
    def utcoffset(self, dt):
        return datetime.timedelta(hours=9)
    def dst(self, dt):
        return datetime.timedelta(0)


# ****************************************
#      メイン処理(各Webページの処理)
# ****************************************

# ***** メインページの表示 *****
#class MainPage(webapp2.RequestHandler):
#    def get(self):
@app.route(mainpage_url)
def MainPage():
    if True:
        # データブックの名前を取得
        #databook_name = get_databook_name(self.request.get('db'))
        databook_name = get_databook_name(request.args.get('db', ''))
        # データブックの表示タイトルを取得
        #databook_title = get_databook_title(self.request.get('db'))
        databook_title = get_databook_title(request.args.get('db', ''))
        # 全文検索用インデックスの名前を取得
        #databook_indexname = get_databook_indexname(self.request.get('db'))
        databook_indexname = get_databook_indexname(request.args.get('db', ''))
        # 表示メッセージの初期化
        message_data = ''

        # 管理者ログインのチェック
        admin_login = False
        if users.is_current_user_admin():
            admin_login = True

        # 管理者ログイン中の表示
        admin_message = ''
        if users.get_current_user():
            if admin_login:
                admin_message = '（管理者としてログインしています）'
            else:
                admin_message = '（管理者ではありません）'

        # ログイン/ログアウトURL設定
        if users.get_current_user():
            #login_url = users.create_logout_url(self.request.uri)
            login_url = users.create_logout_url(request.url)
            login_text = '[ログアウト]'
        else:
            #login_url = users.create_login_url(self.request.uri)
            login_url = users.create_login_url(request.url)
            # login_text = '[ログイン]'
            login_text = '[管理]'

        # 書き込み禁止の判定
        write_disabled_message = ''
        if not capabilities.CapabilitySet('datastore_v3', ['write']).is_enabled():
            write_disabled_message = '【現在書き込みは禁止しています】'


        # 全文検索の単語と、検索のオフセットを取得
        search_flag = False
        search_count = 0
        #req_search_word = self.request.get('word').strip()
        req_search_word = request.args.get('word', '').strip()
        #req_show_offset = self.request.get('offset').strip()
        req_show_offset = request.args.get('offset', '').strip()
        search_word = req_search_word
        show_offset = int(req_show_offset) if req_show_offset.isdigit() else 0
        show_all_flag = False
        # 全文検索の単語の先頭が「=」のときは特別扱い
        if search_word.startswith('='):
            i = 1
            while i < len(search_word):
                ch = search_word[i]
                # 「*」のときは表示フラグを無視して全て表示する
                if ch == '*':
                    i += 1
                    show_all_flag = True
                    continue
                # 「,」のときは処理継続
                if ch == ',':
                    i += 1
                    continue
                # その他のときは抜ける
                break
            search_word = search_word[i:].strip()
        # # (デバッグ用ログ)
        # logging.debug('search_word={0}'. format(search_word))
        # logging.debug('show_offset={0}'. format(show_offset))

        # 全文検索の単語をチェック
        if search_word:
            # 全文検索を行うとき
            articles = []
            # 検索結果を日付の降順でソートする指定
            expr_list = [search.SortExpression(
                expression='date', default_value=datetime.datetime.min,
                direction=search.SortExpression.DESCENDING)]
            # ソートオプションに設定する
            sort_opts = search.SortOptions(expressions=expr_list)
            # クエリーオプションに設定する
            # (表示件数指定、ソートオプション指定、検索結果はタイトルのみ取得)
            query_opts = search.QueryOptions(limit=mainpage_show_num, offset=show_offset, sort_options=sort_opts, returned_fields=['title'])
            try:
                # 単語とクエリーオプションを指定して全文検索実行
                query_obj = search.Query(query_string=search_word, options=query_opts)
                search_results = search.Index(name=databook_indexname).search(query=query_obj)
                # 検索結果から記事のタイトルを取得する
                req_titles = []
                for scored_doc in search_results:
                    req_titles.append(scored_doc.field('title').value)
                if len(req_titles) >= 1:
                    # 記事を検索(タイトルで表示件数まで)
                    if show_all_flag:
                        articles_query = Article.query(Article.title.IN(req_titles), ancestor=databook_key(databook_name)).order(-Article.date)
                    else:
                        articles_query = Article.query(Article.title.IN(req_titles), Article.show_flag == 1, ancestor=databook_key(databook_name)).order(-Article.date)
                    articles = articles_query.fetch(mainpage_show_num)
            #except (search.QueryError, search.InvalidRequest), e:
            except (search.QueryError, search.InvalidRequest) as e:
                # クエリーエラーのとき
                message_data += '（クエリーエラー（検索文字列に記号が含まれると発生することがあります））'
            search_flag = True
            search_count = len(articles)
        else:
            # 全文検索を行わないとき
            # 記事を取得(日付の新しい順に表示件数まで)
            if show_all_flag:
                articles_query = Article.query(ancestor=databook_key(databook_name)).order(-Article.date)
            else:
                articles_query = Article.query(Article.show_flag == 1, ancestor=databook_key(databook_name)).order(-Article.date)
            articles = articles_query.fetch(mainpage_show_num, offset=show_offset)


        # 記事を表示用に整形
        for article in articles:
            # 表示文字数を制限
            article.title = article.title[:100]
            article.author = article.author[:100]
            article.content = article.content[:100]
            # ローカル日時変換(表示用)
            article.date = article.date.replace(tzinfo=UTC()).astimezone(JapanTZ())

        # 文字コード変換(表示用)
        #databook_title = databook_title.decode('utf-8')
        #message_data = message_data.decode('utf-8')
        #admin_message = admin_message.decode('utf-8')
        #login_text = login_text.decode('utf-8')
        #write_disabled_message = write_disabled_message.decode('utf-8')

        # メインページのテンプレートに記事データを埋め込んで表示
        #template = jinja_environment.get_template(mainpage_html)
        #self.response.out.write(template.render(databook_title=databook_title,
        #                                        databook_name=databook_name,
        #                                        articles=articles,
        #                                        mainpage_url=mainpage_url,
        #                                        editpage_url=editpage_url,
        #                                        runpage_url=runpage_url,
        #                                        message_data=message_data,
        #                                        search_flag=search_flag,
        #                                        search_count=search_count,
        #                                        search_word=req_search_word,
        #                                        show_offset=show_offset,
        #                                        admin_login=admin_login,
        #                                        admin_message=admin_message,
        #                                        login_url=login_url,
        #                                        login_text=login_text,
        #                                        mainpage_show_num=mainpage_show_num,
        #                                        write_disabled_message=write_disabled_message))
        template = render_template(mainpage_html,
                                   databook_title=databook_title,
                                   databook_name=databook_name,
                                   articles=articles,
                                   mainpage_url=mainpage_url,
                                   editpage_url=editpage_url,
                                   runpage_url=runpage_url,
                                   message_data=message_data,
                                   search_flag=search_flag,
                                   search_count=search_count,
                                   search_word=req_search_word,
                                   show_offset=show_offset,
                                   admin_login=admin_login,
                                   admin_message=admin_message,
                                   login_url=login_url,
                                   login_text=login_text,
                                   mainpage_show_num=mainpage_show_num,
                                   write_disabled_message=write_disabled_message)
        return template


# ***** 実行ページの表示 *****
#class RunPage(webapp2.RequestHandler):
#    # def post(self):
#    def get(self):
@app.route(runpage_url)
def RunPage():
    if True:
        # データブックの名前を取得
        #databook_name = get_databook_name(self.request.get('db'))
        databook_name = get_databook_name(request.args.get('db', ''))

        # 記事のタイトルをチェック
        #req_title = self.request.get('title').strip()
        req_title = request.args.get('title', '').strip()
        if not req_title:
            no_article = 1
        else:
            no_article = 0

        # 記事を検索(タイトルで1件だけ)
        if no_article == 0:
            articles_query = Article.query(Article.title == req_title, ancestor=databook_key(databook_name)).order(-Article.date)
            articles = articles_query.fetch(1)
            if len(articles) < 1:
                no_article = 1
            else:
                article = articles[0]

        # # 記事が存在しなければダミーの空データを作成
        # if no_article == 1:
        #     article = Article(parent=databook_key(databook_name))
        #     article.source = ''

        # 記事が存在しなければ 404 Not Found エラーにする
        if no_article == 1:
            #webapp2.abort(404)
            #return
            return "", 404

        # 実行ページのテンプレートに記事データを埋め込んで表示
        #template = jinja_environment.get_template(runpage_html)
        #self.response.out.write(template.render(databook_name=databook_name,
        #                                        article=article))
        template = render_template(runpage_html,
                                   databook_name=databook_name,
                                   article=article)
        return template


# ***** 編集ページの表示 *****
#class EditPage(webapp2.RequestHandler):
#    def post(self):
@app.route(editpage_url, methods=["POST"])
def EditPage():
    if True:
        # データブックの名前を取得
        #databook_name = get_databook_name(self.request.get('db'))
        databook_name = get_databook_name(request.form.get('db', ''))
        # 表示メッセージの初期化
        message_data = ''

        # 記事のタイトルをチェック
        #req_title = self.request.get('title').strip()
        req_title = request.form.get('title', '').strip()
        if not req_title:
            #self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
            #return
            return redirect(mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 管理者ログインのチェック
        admin_login = False
        if users.is_current_user_admin():
            admin_login = True

        # 書き込み禁止の判定
        write_disabled_message = ''
        if not capabilities.CapabilitySet('datastore_v3', ['write']).is_enabled():
            write_disabled_message = '【現在書き込みは禁止しています】'

        # 日時更新のチェック(デフォルトON)
        datechg_flag = 1
        #if self.request.get('datechg') == '0':
        if request.form.get('datechg', '') == '0':
            datechg_flag = 0


        # 記事を検索(タイトルで1件だけ)
        articles_query = Article.query(Article.title == req_title, ancestor=databook_key(databook_name)).order(-Article.date)
        articles = articles_query.fetch(1)
        # 記事が存在しなければ新規作成
        if len(articles) < 1:
            article = Article(parent=databook_key(databook_name))
            article.title = req_title
            article.author = ''
            article.content = ''
            article.source = ''
            article.date = datetime.datetime.now()
            article.bkup_authors = []
            article.bkup_contents = []
            article.bkup_sources = []
            article.bkup_dates = []
            article.bkup_lastupdate = datetime.datetime.min
            article.search_doc_id = ''
            article.show_flag = 1
        else:
            article = articles[0]
            # バックアップをロードするかのチェック
            #req_bkup_sel = self.request.get('bkup_sel')
            req_bkup_sel = request.form.get('bkup_sel', '')
            if req_bkup_sel and req_bkup_sel.isdigit():
                req_bkup_no = int(req_bkup_sel) - 1
                if req_bkup_no >= 0 and req_bkup_no < len(article.bkup_dates):
                    article.author = article.bkup_authors[req_bkup_no]
                    article.content = article.bkup_contents[req_bkup_no]
                    article.source = article.bkup_sources[req_bkup_no]
                    # article.date = article.bkup_dates[req_bkup_no]
                    date_temp = article.bkup_dates[req_bkup_no]
                    date_temp = date_temp.replace(tzinfo=UTC()).astimezone(JapanTZ())
                    message_data += '（「' + date_temp.strftime('%Y-%m-%d %H:%M:%S %Z') + '」の履歴をロードしました）'
            # 全文検索用ドキュメントの登録チェック
            if not article.search_doc_id:
                message_data += '（全文検索未登録）'


        # 文字コード変換(表示用)
        #message_data = message_data.decode('utf-8')
        #write_disabled_message = write_disabled_message.decode('utf-8')

        # ローカル日時変換(表示用)
        article.date = article.date.replace(tzinfo=UTC()).astimezone(JapanTZ())
        for i in range(len(article.bkup_dates)):
            article.bkup_dates[i] = article.bkup_dates[i].replace(tzinfo=UTC()).astimezone(JapanTZ())

        # 編集ページのテンプレートに記事データを埋め込んで表示
        #template = jinja_environment.get_template(editpage_html)
        #self.response.out.write(template.render(databook_name=databook_name,
        #                                        article=article,
        #                                        update_url=update_url,
        #                                        runpage_url=runpage_url,
        #                                        mainpage_url=mainpage_url,
        #                                        editpage_url=editpage_url,
        #                                        message_data=message_data,
        #                                        admin_login=admin_login,
        #                                        datechg_flag=datechg_flag,
        #                                        write_disabled_message=write_disabled_message))
        template = render_template(editpage_html,
                                   databook_name=databook_name,
                                   article=article,
                                   update_url=update_url,
                                   runpage_url=runpage_url,
                                   mainpage_url=mainpage_url,
                                   editpage_url=editpage_url,
                                   message_data=message_data,
                                   admin_login=admin_login,
                                   datechg_flag=datechg_flag,
                                   write_disabled_message=write_disabled_message)
        return template


# ***** データブックの更新 *****
#class Databook(webapp2.RequestHandler):
#    def post(self):
@app.route(update_url, methods=["POST"])
def Databook():
    if True:
        # データブックの名前を取得
        #databook_name = get_databook_name(self.request.get('db'))
        databook_name = get_databook_name(request.form.get('db', ''))
        # 全文検索用インデックスの名前を取得
        #databook_indexname = get_databook_indexname(self.request.get('db'))
        databook_indexname = get_databook_indexname(request.form.get('db', ''))
        # 表示メッセージの初期化
        message_data = ''

        # 記事のタイトルをチェック
        #req_title = self.request.get('title').strip()
        req_title = request.form.get('title', '').strip()
        if not req_title:
            #self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
            #return
            return redirect(mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 管理者ログインのチェック
        admin_login = False
        if users.is_current_user_admin():
            admin_login = True

        # 書き込み禁止の判定
        write_enabled = True
        write_disabled_message = ''
        if not capabilities.CapabilitySet('datastore_v3', ['write']).is_enabled():
            write_enabled = False
            write_disabled_message = '【現在書き込みは禁止しています】'

        # 日時更新のチェック(デフォルトOFF)
        datechg_flag = 0
        #if self.request.get('datechg') == '1':
        if request.form.get('datechg', '') == '1':
            datechg_flag = 1


        # 記事を検索(タイトルで1件だけ)
        articles_query = Article.query(Article.title == req_title, ancestor=databook_key(databook_name)).order(-Article.date)
        articles = articles_query.fetch(1)
        # 記事が存在しなければ新規作成
        if len(articles) < 1:
            article = Article(parent=databook_key(databook_name))
            article.title = req_title
            article.author = ''
            article.content = ''
            article.source = ''
            article.date = datetime.datetime.now()
            article.bkup_authors = []
            article.bkup_contents = []
            article.bkup_sources = []
            article.bkup_dates = []
            article.bkup_lastupdate = datetime.datetime.min
            article.search_doc_id = ''
            article.show_flag = 1
        else:
            article = articles[0]

        # ログインユーザー名をセット(今回未使用)
        # if users.get_current_user():
        #     article.author = users.get_current_user().nickname()

        # 送信されたデータを記事に設定
        #if self.request.get('delete') != '1' and self.request.get('rename') != '1':
        if request.form.get('delete', '') != '1' and request.form.get('rename', '') != '1':
            #article.author = self.request.get('author').strip()
            #article.content = self.request.get('content').strip()
            #article.source = self.request.get('source')
            article.author = request.form.get('author', '').strip()
            article.content = request.form.get('content', '').strip()
            article.source = request.form.get('source', '')
            if datechg_flag == 1:
                article.date = datetime.datetime.now()


        # 記事の非表示(保守用)
        if write_enabled and article.author.startswith('=hide'):
            article.show_flag = 0
        else:
            article.show_flag = 1

        # 記事の削除(保守用)
        # if article.author.startswith('=delete'):
        #if write_enabled and self.request.get('delete') == '1':
        if write_enabled and request.form.get('delete', '') == '1':
            if admin_login and article.bkup_dates:
                # (関連する全文検索用ドキュメントがあればそれも削除)
                if article.search_doc_id:
                    search.Index(name=databook_indexname).delete(article.search_doc_id)
                article.key.delete()
            #self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
            #return
            return redirect(mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 全文検索用ドキュメントの個別削除(保守用)
        if write_enabled and article.author.startswith('=index_delete'):
            if admin_login:
                doc_id = article.content
                if doc_id:
                    search.Index(name=databook_indexname).delete(doc_id)
            #self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
            #return
            return (mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 全文検索用ドキュメントの全削除(保守用)
        if write_enabled and article.author.startswith('=all_index_delete'):
            if admin_login:
                search_index = search.Index(name=databook_indexname)
                while True:
                    doc_ids = [doc.doc_id for doc in search_index.get_range(ids_only=True)]
                    if not doc_ids:
                        break
                    search_index.delete(doc_ids)
            #self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
            #return
            return redirect(mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 記事のタイトル変更(保守用)
        rename_flag = 0
        #if write_enabled and self.request.get('rename') == '1':
        if write_enabled and request.form.get('rename', '') == '1':
            #new_title = self.request.get('newtitle').strip()
            new_title = request.form.get('newtitle', '').strip()
            if admin_login and new_title and new_title != article.title and article.bkup_dates:
                # 記事を検索(新タイトルで1件だけ)
                articles_query = Article.query(Article.title == new_title, ancestor=databook_key(databook_name)).order(-Article.date)
                articles_temp = articles_query.fetch(1)
                # 記事が存在しなければ、タイトルを変更できる
                if len(articles_temp) < 1:
                    article.title = new_title
                    rename_flag = 1
                else:
                    rename_flag = 2
            else:
                rename_flag = 2


        # バックアップの保存
        # (10分以内のときは、バックアップを追加しないで上書きとする)
        if write_enabled and rename_flag == 0:
            time_diff_minutes = -1
            if article.bkup_lastupdate:
                time_diff = datetime.datetime.now() - article.bkup_lastupdate
                time_diff_minutes = time_diff.days * 24 * 60 + time_diff.seconds / 60
            if time_diff_minutes >= 0 and time_diff_minutes <= backup_time:
                # 最新のバックアップを上書き
                article.bkup_authors[0] = article.author
                article.bkup_contents[0] = article.content
                article.bkup_sources[0] = article.source
                article.bkup_dates[0] = article.date
            else:
                # バックアップを追加(最大10件)
                article.bkup_authors.insert(0, article.author)
                article.bkup_contents.insert(0, article.content)
                article.bkup_sources.insert(0, article.source)
                article.bkup_dates.insert(0, article.date)
                if len(article.bkup_dates) > backup_num:
                    article.bkup_authors = article.bkup_authors[:backup_num]
                    article.bkup_contents = article.bkup_contents[:backup_num]
                    article.bkup_sources = article.bkup_sources[:backup_num]
                    article.bkup_dates = article.bkup_dates[:backup_num]
                article.bkup_lastupdate = datetime.datetime.now()


        # 全文検索用ドキュメントを登録する
        if write_enabled and (rename_flag == 0 or rename_flag == 1):
            date_str = article.date.replace(tzinfo=UTC()).astimezone(JapanTZ()).strftime('%Y-%m-%d %H:%M:%S %Z')
            doc_content = article.title + ' ' + article.author + ' ' + article.content + ' ' + date_str
            if article.search_doc_id:
                # すでに登録されていれば上書き
                doc = search.Document(
                    doc_id=article.search_doc_id,
                    fields=[search.TextField(name='title',   value=article.title, language='ja'),
                            search.TextField(name='content', value=doc_content,   language='ja'),
                            search.DateField(name='date',    value=article.date)])
                put_result = search.Index(name=databook_indexname).put(doc)
            else:
                # 登録されていなければ新規作成(このときドキュメントIDを記憶しておく)
                doc = search.Document(
                    fields=[search.TextField(name='title',   value=article.title, language='ja'),
                            search.TextField(name='content', value=doc_content,   language='ja'),
                            search.DateField(name='date',    value=article.date)])
                put_result = search.Index(name=databook_indexname).put(doc)
                # ↓これではドキュメントIDとれないので注意。putの戻り値から取得する必要がある
                # article.search_doc_id = doc.doc_id
                article.search_doc_id = put_result[0].id


        # 記事をデータブックに登録
        if write_enabled:
            if rename_flag == 0:
                article.put()
                message_data += '（セーブしました）'
            elif rename_flag == 1:
                article.put()
                message_data += '（タイトルを変更しました）'
            else:
                message_data += '（タイトルを変更できません（名称が不正もしくは同名が存在する等））'
        else:
            message_data += '（書き込みが禁止されています）'


        # # メインページに戻る
        # self.redirect(mainpage_url + '?' + urllib.urlencode({'db': databook_name}))
        #redirect(mainpage_url + '?' + urllib.parse.urlencode({'db': databook_name}))

        # 文字コード変換(表示用)
        #message_data = message_data.decode('utf-8')
        #write_disabled_message = write_disabled_message.decode('utf-8')

        # ローカル日時変換(表示用)
        article.date = article.date.replace(tzinfo=UTC()).astimezone(JapanTZ())
        for i in range(len(article.bkup_dates)):
            article.bkup_dates[i] = article.bkup_dates[i].replace(tzinfo=UTC()).astimezone(JapanTZ())

        # 編集ページのテンプレートに記事データを埋め込んで表示
        #template = jinja_environment.get_template(editpage_html)
        #self.response.out.write(template.render(databook_name=databook_name,
        #                                        article=article,
        #                                        update_url=update_url,
        #                                        runpage_url=runpage_url,
        #                                        mainpage_url=mainpage_url,
        #                                        editpage_url=editpage_url,
        #                                        message_data=message_data,
        #                                        admin_login=admin_login,
        #                                        datechg_flag=datechg_flag,
        #                                        write_disabled_message=write_disabled_message))
        template = render_template(editpage_html,
                                   databook_name=databook_name,
                                   article=article,
                                   update_url=update_url,
                                   runpage_url=runpage_url,
                                   mainpage_url=mainpage_url,
                                   editpage_url=editpage_url,
                                   message_data=message_data,
                                   admin_login=admin_login,
                                   datechg_flag=datechg_flag,
                                   write_disabled_message=write_disabled_message)
        return template


# ****************************************
#                実行開始
# ****************************************

## ***** アプリケーションの実行 *****
#application = webapp2.WSGIApplication([
#    (mainpage_url, MainPage),
#    (runpage_url,  RunPage ),
#    (editpage_url, EditPage),
#    (update_url,   Databook),
#], debug=True)
