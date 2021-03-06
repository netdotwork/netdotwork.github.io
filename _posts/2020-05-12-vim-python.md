---
layout: post
title: VIM + Python <3
summary: Для тру девелопмента на Python вам нужен VIM.
featured-img:
categories: Linux Code
tags: [ code, python, notes ]
---
Ребята! Ну вы чего! Только VIM, только скорость и решительность!

Пора явить интернету очередной гайд по настройке VIM для работы с Python day by day.
Может быть, я смогу направить и вас на истинный путь тру девелопмента.

## Установка

### *NIX / Linux

В вашем *NIX / Linux, скорее всего уже есть vim.
Проверяем:

`vim --version`

Вывод должен быть похож на этот:
```
VIM - Vi IMproved 8.2 (2019 Dec 12, собрано Apr 14 2020 16:54:38)
Заплатки: 1-577
Огромная версия без графического интерфейса.
  Включённые(+) и отключённые(-) особенности:
+acl               -farsi             +mouse_sgr         +tag_binary
+arabic            +file_in_path      -mouse_sysmouse    -tag_old_static
+autocmd           +find_in_path      +mouse_urxvt       -tag_any_white
+autochdir         +float             +mouse_xterm       -tcl
-autoservername    +folding           +multi_byte        +termguicolors
-balloon_eval      -footer            +multi_lang        +terminal
+balloon_eval_term +fork()            -mzscheme          +terminfo
-browse            +gettext           +netbeans_intg     +termresponse
++builtin_terms    -hangul_input      +num64             +textobjects
+byte_offset       +iconv             +packages          +textprop
+channel           +insert_expand     +path_extra        +timers
+cindent           +ipv6              +perl              +title
+clientserver      +job               +persistent_undo   -toolbar
+clipboard         +jumplist          +popupwin          +user_commands
+cmdline_compl     +keymap            +postscript        +vartabs
+cmdline_hist      +lambda            +printer           +vertsplit
+cmdline_info      +langmap           +profile           +virtualedit
+comments          +libcall           -python            +visual
+conceal           +linebreak         +python3           +visualextra
+cryptv            +lispindent        +quickfix          +viminfo
+cscope            +listcmds          +reltime           +vreplace
+cursorbind        +localmap          +rightleft         +wildignore
+cursorshape       +lua               +ruby              +wildmenu
+dialog_con        +menu              +scrollbind        +windows
+diff              +mksession         +signs             +writebackup
+digraphs          +modify_fname      +smartindent       +X11
-dnd               +mouse             -sound             +xfontset
-ebcdic            -mouseshape        +spell             -xim
+emacs_tags        +mouse_dec         +startuptime       +xpm
+eval              -mouse_gpm         +statusline        +xsmp_interact
+ex_extra          -mouse_jsbterm     -sun_workshop      +xterm_clipboard
+extra_search      +mouse_netterm     +syntax            -xterm_save
```

Что нас здесь интересует? Поддержка python3 (python2, наверное, уже не так актуален).

**Если vim не установлен, установим:**

`sudo apt update`

`sudo apt install vim`

**Если vim установлен, но не поддерживает python3, собираем из исходников:**
- [тык](https://www.vim.org/download.php){:target="_blank"}
- [тык](https://github.com/ycm-core/YouCompleteMe/wiki/Building-Vim-from-source){:target="_blank"}

Снова проверяем:

`vim --version`

Теперь проверим версию python, используемую в vim:
- `vim`
- откроем интерпретатор `:!python` или `:!ipython` (если пользуетесь)

```
Python 2.7.17 (default, Nov  7 2019, 10:07:09) 
[GCC 9.2.1 20191008] on linux2
```
Да, сейчас 2.7, исправим это позже, с помощью виртуальных окружений.

Вероятно, дальше будет немного проще, если открыть мой [.vimrc](https://github.com/netdotwork/vimrc/blob/master/.vimrc){:target="_blank"}.

## Плагины VIM

Плагины нужны, чтобы превратить vim в IDE.

### Менеджер плагинов

Существуют разные плагин менеджеры. Хороший и популярный вариант - [Vundle](https://github.com/VundleVim/Vundle.vim){:target="_blank"}. Скопируем в директорию для расширений vim:

`git clone https://github.com/gmarik/Vundle.vim.git ~/.vim/bundle/Vundle.vim`

Настроим Vundle.

Вероятно, у вас уже есть .vimrc в домашней директории. Если нет, создадим:

`touch ~/.vimrc`

Откроем ~/.vimrc:

`vim ~/.vimrc`

Копируем(пока, можно сделать это через контекстное меню):

```
set nocompatible              " be iMproved, required
filetype off                  " required

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
" alternatively, pass a path where Vundle should install plugins
"call vundle#begin('~/some/path/here')

" let Vundle manage Vundle, required
Plugin 'VundleVim/Vundle.vim'

" the place for other plugins

" All of your Plugins must be added before the following line
call vundle#end()            " required
filetype plugin indent on    " required
" To ignore plugin indent changes, instead use:
"filetype plugin on
"
" Brief help
" :PluginList       - lists configured plugins
" :PluginInstall    - installs plugins; append `!` to update or just :PluginUpdate
" :PluginSearch foo - searches for foo; append `!` to refresh local cache
" :PluginClean      - confirms removal of unused plugins; append `!` to auto-approve removal
"
" see :h vundle for more details or wiki for FAQ
" Put your non-Plugin stuff after this line
```

Здесь же разберемся, как устанавливать и удалять плагины.

Например, [NERDTree](https://github.com/preservim/nerdtree){:target="_blank"}, **file browsing** плагин - открывает в отдельном вертикальном split'е дерево файлов и директорий.

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/nerdtree.png)

Достаточно добавить `Plugin 'scrooloose/nerdtree'` между строками `call vundle#begin()` и `call vundle#end()` (там, где написано `the place for other plugins`) и выполнить `:PluginInstall`

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/plugin_install.png)

При установке появится окно установщика и `+` напротив установленного плагина.

Чтобы удалить - уберите `Plugin 'scrooloose/nerdtree'` и выполните `:PluginClean`. Выше небольшой help.

В общем, всё это справедливо для большинства vim плагинов.

Добьем вопрос с NERDTree и установим плагин [NERDTreetabs](https://github.com/jistr/vim-nerdtree-tabs){:target="_blank"} для работы в разных вкладках. По аналогии с NERDTree добавляем в ~/.vimrc:

`Plugin 'jistr/vim-nerdtree-tabs'`

Устанавливаем

`:PluginInstall`

Мы, все ещё, не вышли из vim.
Проверим список установленных плагинов - `:PluginList`, сохраним и выйдем `:wq!`

Кстати, можно выполнять команды Vundle из терминала, например, так:

`vim +PluginInstall` или `vim +PluginList`

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/vim_plugin_list.png)


### Key combinations

Надо, надо, ребята, потратить свое время на изучение. Свои основные кнопки написал в самом низу страницы.


### Split Layouts

Можно открывать файлы в вертикальном и горизонтальном сплитах, а в этих сплитах открывать новые сплиты.

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/splits.png)

Настроим зоны для новых сплитов (новые вертикальные будут открываться справа, горизонтальные - внизу):

```
set splitbelow
set splitright
```

Настроим навигацию между сплитами:

```
" split navigations
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>
```

```
Ctrl+J переключиться вниз
Ctrl+K переключиться вверх
Ctrl+L переключиться вправо
Ctrl+H переключиться влево
```

nnoremap переназначает одну комбинацию клавиш на другую, при работе в Normal Mode. Например, было `<Ctrl+W><Ctrl+J>`, стало `<Ctrl+J>`. При этом `<Ctrl+W>` также будет работать.
[Подробнее](http://stackoverflow.com/questions/3776117/what-is-the-difference-between-the-remap-noremap-nnoremap-and-vnoremap-mapping){:target="_blank"}

### Code Folding

Полезная фича - сворачивание кода. Сворачивает до ближайшего whitespace на основе отступов (foldmethod=indent). Выглядит как-то так:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/code_folding.png)

Добавляем в наш .vimrc:

```
" Enable folding
set foldmethod=indent
set foldlevel=99
```

По умолчанию, работает по комбинации `za`. Меняю на пробел:

```
" Enable folding with the spacebar
nnoremap <space> za
```

Чтобы код сворачивался аккуратнее лучше установить какой-нибудь плагин, добавляем:

`Plugin 'tmhedberg/SimpylFold'`

Запускаем `:PluginInstall`

### Python indentation

Для корректного code folding и соответствия PEP 8 настроим отступы и длину строки

```
au BufRead,BufNewFile *.py,*pyw set tabstop=4
au BufRead,BufNewFile *.py,*pyw set softtabstop=4
au BufRead,BufNewFile *.py,*pyw set autoindent
au BufRead,BufNewFile *.py,*pyw set shiftwidth=4
au BufRead,BufNewFile *.py,*.pyw set expandtab
au BufRead,BufNewFile *.py,*.pyw,*.c,*.h set textwidth=79
au BufNewFile *.py,*.pyw,*.c,*.h set fileformat=unix

" for full stack development
au BufNewFile,BufRead *.js, *.html, *.css set tabstop=2
au BufNewFile,BufRead *.js, *.html, *.css set shiftwidth=2
au BufNewFile,BufRead *.js, *.html, *.css set softtabstop=2
```

Autoindent не всегда будет работать корректно, но это лечится плагином (устанавливаем через Vundle):

Plugin 'vim-scripts/indentpython.vim'

### Flagging Unnecessary Whitespace

Лишние пробелы в коде лучше сразу удалять. Создадим флаг и подсветим красным

```
" Use the below highlight group when displaying bad whitespace is desired.
highlight BadWhitespace ctermbg=red guibg=red

" Make trailing whitespace be flagged as bad.
au BufRead,BufNewFile *.py,*.pyw,*.c,*.h match BadWhitespace /\s\+$/
```

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/red_whitespaces.png)

Чтобы удалить найденные пробелы можно воспользоваться заменой: 

```
:%s/\s\+$//e
```

Можете выбрать подходящий вам вариант обработки пробелов [здесь](https://vim.fandom.com/wiki/Remove_unwanted_spaces){:target="_blank"}

### UTF-8 Support

Для работы с Python3 Vim должен уметь кодировать utf-8. Добавим в .vimrc:

```
set encoding=utf-8
```

### Virtualenv Support

То, что вам обязательно нужно - виртуальные окружения.

Про установку виртуальных окружений в Python:
- [тык](https://github.com/netdotwork/pyneng-my-exercises/blob/master/virtualenv_python.md){:target="_blank"}
- [тык](https://pyneng.github.io/docs/venv/){:target="_blank"}

По умолчанию, Vim ничего не знает об используемом виртуальном окружении.

Чтобы все было хорошо, и при запуске vim подхватывал то окрежние, в котором вы находитесь, добавим в .vimrc:

```
" python with virtualenv support
py3 << EOF
import os
import sys
if 'VIRTUAL_ENV' in os.environ:
  project_base_dir = os.environ['VIRTUAL_ENV']
  activate_this = os.path.join(project_base_dir, 'bin/activate_this.py')
  #execfile(activate_this, dict(__file__=activate_this)) # устарел execfile
  exec(open(activate_this).read(), dict(__file__=activate_this))
EOF
```

Но это не всё. Если у вас уже есть виртуальные окружения, то переключаться между ними можно внутри vim, вручную, с помощью плагина [vim-virtualenv](https://github.com/jmcantrell/vim-virtualenv){:target="_blank"}.

Установим через Vundle:

`Plugin 'jmcantrell/vim-virtualenv'`

`:PluginInstall`

Теперь, запустим виртуальное окружение:

`:VirtualEnvActivate <tab>`

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/virtualenv.png)

Деактивируем:

`:VirtualEnvDeactivate`

### Auto-Complete

С недавних пор пользуюсь автодополнением. 

Использование плагина [YouCompleteMe](https://github.com/ycm-core/YouCompleteMe){:target="_blank"} не принесло мне много радости. Но это субъективно.

[Тут инструкция по установке](https://github.com/ycm-core/YouCompleteMe#linux-64-bit){:target="_blank"}

Есть проблемы и для решения, как правило, предлагают этот [рецепт](https://github.com/ycm-core/YouCompleteMe/issues/2271){:target="_blank"}.

По душе мне пришелся [neoclide/coc.nvim](https://github.com/neoclide/coc.nvim){:target="_blank"}.

Он универсален, работает как с `Jedi`, так и с `Microsoft PLS` (и то, и другое - это Language Server, еще поговорим об этом).
Умеет в IDE capabilities, например, покажет вам аннотации типов или `__doc__` объекта.
Удобно настраивать, опций - огромное множество.

Установим.

Сперва, [Jedi](https://jedi.readthedocs.io/en/latest/docs/installation.html){:target="_blank"} или [Jedi](https://github.com/davidhalter/jedi){:target="_blank"}.

`Jedi` - это Language Server, фоновый процесс, который будет анализировать наш код. С помощью `coc.nvim`, будем просить его дополнить код, выполнить форматирование или рефакторинг.
[Здесь](https://www.vimfromscratch.com/articles/vim-and-language-server-protocol/){:target="_blank"} хорошо и кратко про `Language Server Protocol (LSP)`.

Вариантов установки много, ставим через `pip` в нужном виртуальном окружении ([про установку виртуальных окружений](https://github.com/netdotwork/pyneng-my-exercises/blob/master/virtualenv_python.md){:target="_blank"}, а еще чуть выше, в Virtualenv Support):

```python
workon 3.8.4 # переключаемся в виртуальное окружение (у меня 3.8.4)
pip install jedi # или любой другой из предложенных вариантов
```

Кстати, там же, в документации, есть ссылка на клиент для `Jedi` - [JEDI-VIM](https://github.com/davidhalter/jedi-vim){:target="_blank"}. Можете попробовать как альтернативу `coc.nvim`.

Теперь установим [coc](https://github.com/neoclide/coc.nvim){:target="_blank"} по [инструкции из Wiki](https://github.com/neoclide/coc.nvim/wiki/Install-coc.nvim){:target="_blank"}. У нас, конечно, же vim 8 (проверить можно через `vim --version`), поэтому воспользуемся встроенный пакетным менеджером:

```python
# for vim8
mkdir -p ~/.vim/pack/coc/start
cd ~/.vim/pack/coc/start
curl --fail -L https://github.com/neoclide/coc.nvim/archive/release.tar.gz|tar xzfv -
```

Здесь же, в `.vimrc`, с помощью встроенного менеджера, установим `coc-python`:

```
:CocInstall coc-python
```

Откроем какой-нибудь скрипт, и, поскольку мы уже в нужном виртуальном окружении(настроили раньше, в Virtualenv Support), переключим интерпретатор на работу с `Jedi` в этом же окружении.
Делается это снова встроенным менеджером:

```
:CocCommand
# здесь мы должны выбрать то, виртуальное окружение, куда ранее установили Jedi
# опция будет постоянной и при работе в другом виртуальном окружении, желателательно снова переключиться

python.setInterpreter
```

В появившемся окне выбираем виртуальное окружение, куда ранее установили `Jedi`. Вот в картинках, до момента выбора окружения:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/coccommand.png)

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/setinterpreter.png)

С помощью `CocCommand` можно настраивать много всего. Фактически, мы правим конфигурационный файл через интерфейс встроенного менеджера.

Посмотрим на интерфейс на примере функции `print`:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/completion.png)

Если `coc.nvim` нужно отключить:

```
:CocDisable
```

Включаем обратно:

```
:CocEnable
```

Теперь добавим полезного в наш `.vimrc` для работы с `coc`:

```
vim ~/.vimrc # открываем
let mapleader = "," # назначим лидер-кнопку, она пригодится

# настроим отображение документации:

nmap <silent> gd <Plug>(coc-definition)

nnoremap <silent> K :call <SID>show_documentation()<CR>
function! s:show_documentation()
  if (index(['vim','help'], &filetype) >= 0)
    execute 'h '.expand('<cword>')
  else
    call CocAction('doHover')
  endif
endfunction
```
Смотрим, как это выглядит (ставим курсор на `print`, жмем `K`):

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/docstring.png)

Добавим аннотации в `~/.vimrc`:

```python
nmap <silent> gd <Plug>(coc-definition)
```

Смотрим на том же примере (ставим курсор на `print`, жмем `gd`):

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/gd.png)

У проекта отличная [Wiki](https://github.com/neoclide/coc.nvim/wiki){:target="_blank"}, если вдруг.

### File Browsing

Плагины [nerdtree](https://github.com/preservim/nerdtree){:target="_blank"} и [vim-nerdtree-tabs](https://github.com/jistr/vim-nerdtree-tabs){:target="_blank"} мы уже установили.

Давайте добавим в конец .vimrc строку:
`let NERDTreeIgnore=['\.pyc$', '\~$']` 

NERDTree будет игнорировать `.pyc`

Если у вас есть вопрос по работе NERDTree, скорее всего он уже решен - [F.A.Q.](https://github.com/preservim/nerdtree/wiki/F.A.Q.){:target="_blank"}

Команды для работы с vim-nerdtree-tabs описаны в [Commands and Mappings](https://github.com/jistr/vim-nerdtree-tabs){:target="_blank"}

Добавим в .vimrc возможность открытия NERDTree по `<F3>`:

```
" map NERDTree on F3
map <F3> :NERDTreeToggle<CR>
```

### Syntax Checking/Highlighting

Плагин для проверки синтаксиса:

`Plugin 'vim-syntastic/syntastic'`

Линтер для PEP 8:

`Plugin 'nvie/vim-flake8'`

Включаем подсветку синтаксиса:

```
let python_highlight_all=1
syntax on
```

### Поддержка markdown

Ну, а почему нет?

Подсветка синтаксиса, превью - все, что нужно.

Смотрим топ плагинов [здесь](https://vimawesome.com/?q=markdown){:target="_blank"}.

Хорошие - [Vim Markdown](https://github.com/plasticboy/vim-markdown){:target="_blank"} и [vim-instant-markdown](https://github.com/suan/vim-instant-markdown){:target="_blank"} как превью.

Устанавливаем уже знакомым способом, через `Vundle`:

```
vim ~/.vimrc

# добавляем
Plugin 'suan/vim-instant-markdown', {'rtp': 'after'} "markdown preview plugin - https://github.com/suan/vim-instant-markdown
Plugin 'godlygeek/tabular' "for work with markdown plugin (Ctrl-p) - https://github.com/godlygeek/tabular
Plugin 'plasticboy/vim-markdown' " best markdown plugin - https://github.com/plasticboy/vim-markdown

# запускаем Vundle
:PluginInstall
```

Добавим для `vim-instant-markdown` доступные настройки в наш `~/.vimrc`:

```
filetype plugin on
"Uncomment to override defaults:
"let g:instant_markdown_slow = 1
"let g:instant_markdown_autostart = 0
"let g:instant_markdown_open_to_the_world = 1
"let g:instant_markdown_allow_unsafe_content = 1
"let g:instant_markdown_allow_external_content = 0
"let g:instant_markdown_mathjax = 1
"let g:instant_markdown_logfile = '/tmp/instant_markdown.log'
"let g:instant_markdown_autoscroll = 0
"let g:instant_markdown_port = 8888
"let g:instant_markdown_python = 1
```

А для `vim-markdown` добавим подсветку YAML, JSON, разрешим открывать ссылки на `.md` в новых вкладках:

```
" vim markdown plugin options - https://github.com/plasticboy/vim-markdown
let g:vim_markdown_frontmatter = 1
let g:vim_markdown_json_frontmatter = 1
let g:vim_markdown_edit_url_in = 'tab'

```

Ну и для удобства настроим отсупы аналогично Python indentation. Мы уже делали это ранее, теперь только добавим `*md` и `*markdown`:

```
au BufRead,BufNewFile *.py,*pyw,*md,*markdown set tabstop=4
au BufRead,BufNewFile *.py,*pyw,*md,*markdown set softtabstop=4
au BufRead,BufNewFile *.py,*pyw,*md,*markdown set autoindent
au BufRead,BufNewFile *.py,*pyw,*md,*markdown set shiftwidth=4
au BufRead,BufNewFile *.py,*.pyw,*md,*markdown set expandtab
```

Например, теперь, помимо подсветки, можно открыть в отдельном сплите все заголовки вашего markdown-файла и переключаться между ними:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/vimmarkdowncommands.png)

А превью будет сразу открываться как новая вкладка в браузере:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/preview.png)


### Color Schemes Switching

У меня много схем оформления vim и возможность переключения между ними по `<F8>`.

Для начала скопируем в `~/.vim/colors/` схемы оформления. Возьмем их, например, [здесь](https://github.com/rainglow/vim){:target="_blank"} и [здесь](https://github.com/rafi/awesome-vim-colorschemes){:target="_blank"}.

В качестве постоянной схемы я использую `dogrun`. В .vimrc добавить схему как постоянную, можно так:

`colorscheme dogrun`

Добавим схемы оформления в vim:

`:SetColors all`

Добавим возможность переключения по `<F8>`, скопировав [этот скрипт](https://vim.fandom.com/wiki/Switch_color_schemes){:target="_blank"} в ~/.vim/plugin/setcolors.vim

Чтобы отобразить текущую схему, можно использовать `:SetColors`.

### Super Searching

Расширенные возможности поиска в vim будут добавлены вместе с плагином [ctrlP](https://github.com/kien/ctrlp.vim){:target="_blank"}

Устанавливаем обычно, через Vundle:

`Plugin 'kien/ctrlp.vim'`

Не забываем `:PluginInstall`

### Status bar with vim-airline

Полезнейшая в работе вещь - статус бар.
Есть [powerline](https://github.com/powerline/powerline){:target="_blank"}, но я использую [vim-airline](Plugin 'vim-airline/vim-airline-themes'){:target="_blank"}

Добавляем в .vimrc и устанавливаем через Vundle:

```
Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes' "
```

Настраиваем:

```
" air-line settings 
" enable tab line with vim-airline plugin
let g:airline#extensions#tabline#enabled = 1
let g:airline_skip_empty_sections = 1
let g:airline_theme='minimalist'
let g:airline_section_y = '%{virtualenv#statusline()}'
```

Теперь, vim будет выглядеть так:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/vim_airline.png)

vim-airline интегрируется со многими плагинами, например, с `ctrlP`, который мы уже установили.

В vim-airline можно добавить, например, наименование используемого виртуального окружения, что мы и сделали.

Подробнее [здесь](https://github.com/vim-airline/vim-airline){:target="_blank"}

### Git Integration

Как по мне, лучший плагин для интеграции vim с git - это [fugitive.vim](https://github.com/tpope/vim-fugitive){:target="_blank"}, хотя бы, по той причине, что он дублирует уже привычный набор команд git и не требует особого изучения.

Устанавливается, как обычно, через Vundle:

`Plugin 'tpope/vim-fugitive'`

Добавим в статус бар:

```
" to add fugitive plugin (for git) in statusline
let g:airline_section_b = '%{FugitiveStatusline()}'
```

Для работы с git есть плагин [vimagit](https://github.com/jreybert/vimagit){:target="_blank"}, но мне он кажется менее удобным.

Для отображения статуса git-репозитория в NERDTree попробуйте [этот плагин](https://github.com/Xuyuanp/nerdtree-git-plugin){:target="_blank"}

### Line Numbering

Нумерация строк будет отображаться в статус баре, который мы установили ранее. Это удобно.

Но, если вы хотите отображать нумерацию строк в vim, добавьте в .vimrc:

`set nu`

### PasteToggle

Иногда вам будет полезна опция `:set paste`.
Используется до вставки скопированного кода "как есть", без autoindent. Актуально при работе в insert mode.

`set pastetoggle=<F2>`

Копируем код, переходим в insert mode, включаем  pastetoggle (F2), вставляем код, отключаем pastetoggle(F2).

Подробнее [здесь](https://vim.fandom.com/wiki/Toggle_auto-indenting_for_code_paste){:target="_blank"}

### Поддержка black и запуск python

[Black](https://github.com/psf/black){:target="_blank"} - популярный форматтер python-кода.

Устанавливаем глобально, через pip:

`pip install black`

На этой же [странице](https://github.com/psf/black){:target="_blank"} есть плагин для vim.

Применять black, достаточно, просто, поэтому отдельным плагином я не пользуюсь.
Основные команды black:

```
black script.py (форматировать файл script.py)
black script.py -l 120 (форматировать с длиной строки 120. По умолчанию 88)
black --diff script.py (посмотреть изменения в формате, но не форматировать)
black . (форматировать все файлы в текущей директории)

```

А в .vimrc добавим hotkey на `<F9>` для запуска black как стороннего инструмента:

```
" manual black code reformatting
nnoremap <F9> :w<CR>:!clear;black %<CR>
```

Теперь добавим возможность сохранения и запуска  python-интерпретатора на `<F5>`:

```
" save and run current python code
nnoremap <F5> ::w!<CR>:!clear;python %<CR>
```

### Вкладки в vim

Добавим клавиши для переключения вкладок в vim:

```
" Ctrl-Left or Ctrl-Right to go to the previous or next tabs
nnoremap <C-Left> :tabprevious<CR>
nnoremap <C-Right> :tabnext<CR>
" Alt-Left or Alt-Right to move the current tab to the left or right
nnoremap <silent> <C-Down> :execute 'silent! tabmove ' . (tabpagenr()-2)<CR>
nnoremap <silent> <C-Up> :execute 'silent! tabmove ' . (tabpagenr()+1)<CR>

```

```
Ctrl+Left - переключить на предыдущую вкладку
Ctrl+Right - переключить на следуюущую вкладку

Alt+Left - переместить вкладку назад
Alt+Right - переместить вкладку вперед

```

Вкладки в vim:

![]({{ site.url }}{{ site.baseurl }}/assets/img/posts/vimrc/tabs.png)


### Switching Buffers

[Про работу с buffers в vim](https://vim.fandom.com/wiki/Using_tab_pages){:target="_blank"}

Для переключения добавим hotkey на `<F7>`:

```
" switching to another buffer manually - https://vim.fandom.com/wiki/Using_tab_pages
" :help switchbuf
set switchbuf=usetab
nnoremap <F7> :sbnext<CR>
nnoremap <S-F7> :sbprevious<CR>
```

### History

Добавим полезную настройку - разрешим хранить историю после выхода из файла:

```
" Maintain undo history between sessions
set undofile
set undodir=~/.vim/undodir
```

## Hotkeys

`i` - insert - режим ввода/редактирования

`esc` - выйти из режима редактирования/визуального режима (можно применять нужное кол-во раз)

`dw` - удалить слово

`dd` - удалить строку

`d$` - удалить всё от текущего месторасположения курсора до конца строки

`d^` - удалить всё от текущего месторасположения курсора до начала строки

`:15 dgg` - прыгнуть на 15 строку и удалить всё, начиная с 15 строки, до начала файла (dG - до конца файла)

`dt'` - удалить все символы в строке от текущего месторасположения до символа одинарной кавычки (можно использовать любой символ)

`5dd` - удалить 5 строк

`5dw` - удалить 5 слов

Символ удаления `d` можно комбинировать с поиском. Например, чтобы удалить все от курсора до конкретного слова, жмем `d`, открываем поиск с помощью `/`, пишем слово, до которого удаляем.

`yy` - скопировать строку (никто не отменял копирование через контестное меню)

`yw` - скопировать слово

`10yy` - скопировать 10 строк

`p` - вставить после курсора (не всегда удобно)

`P` - вставить до курсора

`:q` - выйти из файла

`:q!` - выйти из файла жестко, без сохранения изменений

`:w` - сохранить файл

`:wq` - сохранить файл и выйти

`ctrl+V` - перейти в визуальный режим

`u` - отменить действие (undo)

`ctrl+R` - return или undo undo (повторить действие)

`hjkl` - передвижение по vim

`^` - начало строки (вернуться к первому не пустому символу в строке)

`0` - вернуться в самое начало строки

`$` - вернуться в конец строки

`A` - вернуться в конец строки и открыть режим редактирования

`I` - вернуться в начало строки и открыть режим редактирования

`o` - прыгнуть на следуюущую строку и перейти в режим редактирования

`w` - передвижение на одно слово вперед

`W` - передвижение от пробела к пробелу (через слово)

`b` - передвижение назад, от слова к слову

`B` - передвижение назад, от пробела к пробелу

`gg` - прыгнуть в начало файла

`G` - прыгнуть в конец файла

`30G` - прыгнуть на нужную строку (для gg аналогично)

`:55` - передвинуть курсор на 55 строку

`ctrl+D` - листать постранично вниз

`ctrl+U` - листать постранично вверх

`zt` - при нахождении на строке, которая расположена в нижней части терминала, поднимаем эту строку на самый верх

`zz` - аналогично предыдущему, но поднимаем строку на середину

`/` - поиск (здесь лучше сразу обратить внимание на инкрементальный режим, т.е. поиск в реальном времени). В поиске есть история - работает нажатием вверх или вниз (по аналогии с :).
Для передвижения по результатам поиска жмем `n` и `N`

`?` - поиск в обратную сторону, по аналогии с `/`

`.` - повторить предыдущую команду

`:s/чтозаменить/начтозаменить` - замена в строке

`:%s/чтозаменить/начтозаменить/` - замена во всем файле (если слово в строке встречается дважды, добавьте g, либо установите set gdefault

`>>` - сдвинуть строку вправо

`<<` - сдвинуть строку влево

`12>` - сдвинуть 12 строк вправо (аналогично влево)

`:vs имя файла` - вертикальный сплит

`:sp` - горизонтальный сплит

`:vertical resize30%` - изменить размер текущего сплита

`:resize` - изменить размер для горизонтального сплита

`za` - свернуть код

`vim  -p file1 file2 file3` - открыть несколько файлов в разных вкладках

`:tabedit имя файла` - открыть файл в новой вкладке

`:tabn (можно с номером вкладки`) - перейти на следующую вкладку

`:tabp` - перейти на предыдущую вкладку

`:tabc` - закрыть вкладку

`:tabfirst` - перейти на первую вкладку

`:tablast` - перейти на последнюю вкладку

`:tabs` - открыть список доступных вкладок

`:tabl` - прыгнуть на последнюю открытую вкладку

`:tab split` - скопировать содержимое текущей вкладки в новую вкладку и перейти на неё

`:tabonly` - закрыть все вкладки, кроме текущей

`:tab ball` или `:tabo` - показать все буферы во вкладках

`:ls` - посмотреть буферы

`q:` - открыть историю буферов

`:qa` - закрыть всё

`!ls` - выполнить shell команду из vim

`!python file.py` - запустить python код (по аналогии с !ls)


Чтобы  добавить вывод команды, запущенной из под vim, в файл, выполняем:
```
vim new_file.txt
:read !python file.py - вывод file.py попадет в new_file.txt
:read !ls -ls - вывод команды попадет в файл new_file.txt
```

Комментируем несколько строк в визуальном режиме:
- `ctrl+V` - переходим в визуальный режим (`shift+V` - выделить всю строку)
- выделяем нужное кол-во строк с помощью указателей (`jk` или `вверх/вниз`)
- `shift+I` - переходим в режим вставки, пишем символ решетки `#` (а, например, если нужно удалить по символу в каждой из выделенных строк, жмем `x`)
- `esc` - возвращаемся в обычный режим (видим результат)


`vim -S session.vim` - открыть сохраненную сессию


## Resources

1. [Основной источник этой статьи](https://realpython.com/vim-and-python-a-match-made-in-heaven/#vim-extensions){:target="_blank"}
2. [Второй источник этой статьи](https://www.vimfromscratch.com/articles/vim-for-python/){:target="_blank"}
3. [Vim and Language Server Protocol](https://www.vimfromscratch.com/articles/vim-and-language-server-protocol/){:target="_blank"}
4. [Лекции по основам vim](https://www.youtube.com/playlist?list=PLah0HUih_ZRkiQXDuElo_JW9OfmbEXRpj){:target="_blank"}
5. [Mapping keys](https://vim.fandom.com/wiki/Mapping_keys_in_Vim_-_Tutorial_(Part_2)){:target="_blank"}
6. [Using tab pages](https://vim.fandom.com/wiki/Using_tab_pages){:target="_blank"}
7. [Отличный сборник плагинов для vim](https://vimawesome.com/){:target="_blank"}
