---
layout: post
title: Tacacs + LDAP + huawei
summary:  Настроим TACACS+, аутентификацию через ldap, авторизацию и аккаунтинг. На Ubuntu Server 19.04, а в качестве сетевого будет Huawei (S, NE, CX, ATN, Eudemon (USG)).
featured-img: kittyonkeyboard
categories: Linux Networking
tags: [ huawei, tacacs+ ]
---
Настроим TACACS+, добавим аутентификацию через ldap, подготовим профили авторизации и аккаунтинг, изучим возможности сервера. Развернем всё это на Ubuntu 19.04, а в качестве сетевого будет Huawei: S, NE, Eudemon (USG).

Почему tacacs+, а не, например, radius?
Radius - это udp, tacacs+ - это tcp, который за счет флагов и механизма окна, будет надежнее и обеспечит реакцию на изменения в сети, что важно для ААА.
Radius шифрует только пароль, tacacs+ ширфует весь заголовок.
Radius позволяет управлять авторизацией только с помощью атрибутов, кол-во которых зависит от производителя. Атрибутом может быть, например, уровень привилегий, директория ftp-сервера (на huawei можно посмотреть командой display radius-attribute). Tacacs+ позволяет управлять авторизацией более гибко, разрешая или запрещая конкретные команды для пользователя или группы.

Смотрим примеры radius-пакетов:

1) Radius-access-request (UDP, шифруется только пароль, NAS - само устройства, NAC - хост, с которого подключаемся к NAS)
![radius-access-request]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/radius-access-request.png)

2) Radius-access-accept (по аналогии с request):
![radius-access-accept]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/radius-access-accept.png)

Смотрим примеры tacacs+ пакетов:

1) Общий перечень, включая установку TCP-соединения, а также его сброс флагом RST после того, как соединение становится неактивным. Все AAA-пакеты зашифрованы, поэтому интересного здесь немного(и это отлично):
![tacacs-all]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/tacacs-all.png)

![tacacs-auth]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/tacacs-auth.png)

![tacacs-authorization]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/tacacs-authorization.png)

## Общее

В ААА последняя буква - это accounting. Лучше заранее подумать, куда будем складывать информацию о том, кто, когда и куда получил доступ и какие действия на оборудовании были выполнены.
Если разворачиваете новый сервер, то лучше использовать LVM для распределения места на диске, сможете быстро менять размер томов при нехватке места. Вообще, для серверов, которые постоянно создают какие-то данные, лучше держать LVM и предусмотреть ротацию этих данных.

Мы будем складывать данные аккаунтинга на наш локальный сервер (хотя можно, например, в syslog, а можно в базу данных, а затем на мониторинг, но об этом попозже). Используем обычные разделы, выделим и примонтируем отдельный раздел для аккаунтинга и настроим ротацию создаваемых логов:
- Выделим место (например, в вашей vmware)
- Проверим на сервере (далее все команды будем выполнять из по root):

`fdisk -l`

смотрим на строчку, где видим общее кол-во Gb на диске:

`Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors`

(я выделил 16Gb для / и 34Gb для остального)
- Создадим из этих 34GB новый primary-раздел и отфоматируем в журналируемую ext4:
`fdisk /dev/sda` (можно использовать более простой cfdisk /dev/sda)

m - вызвать справку по командам fdisk

n - создать новый раздел (создаем sda3 на все 34Gb)
Раздел создали, теперь форматируем в ext4:

`mkfs.ext4 /dev/sda3`

Отформатировали, теперь примонтируем:
создаем директорию для аккаунтинга:

```
cd /var/log
mkdir tac_plus
nano /etc/fstab
```

добавляем строчку:

`/dev/sda3       /var/log/tac_plus  ext4    defaults        1 2`

`mount -a`

Теперь настроим ротацию с помощью logrotate:

1) установим утилиту:

`apt update && apt install logrotate`

2) создадем новый конфигурационный файл для ротации в /etc/logrotate.d/. Этот файл уже будет выполняться ежедневно по cron:

`touch tacacs`

Внесем настройки:

`nano /etc/logrotate.d/tacacs`

```
/var/log/nxtt_tac_plus/access/*.txt* {
        daily
        missingok
        rotate 365
}

/var/log/nxtt_tac_plus/accounting/*.txt* {
        daily
        missingok
        rotate 365
}

/var/log/nxtt_tac_plus/authentication/*.txt* {
        daily
        missingok
        rotate 365
}
```

`daily` - выполнить ротацию ежедневно.

`missingok` - не выдавать ошибки, если отсутствуют файлы для ротации

`rotate` - кол-во логов, которые оставляем после каждой ротации

Т.е. будем ежедневно проверять содержимое директорий, оставлять последние 365 файлов, остальные удалять.
У Logrotate много параметров, и утилиту можно использовать не только для логов:

`man logrotate`

## Обычный tacacs

Развернем tacacs из стандартных репозиториев. Здесь не будет аутентификации через LDAP (если нужен LDAP, то пропускаем этот раздел и переходим к следующему. Для работы с LDAP потребуется установить другой пакет).
Обновляем индекс и устанавливаем пакет:

`apt update && apt install tacacs+`

Демон должен запуститься, проверим любой из команд:

`systemctl status tac_plus`

`service tac_plus status`

`ps -e | grep tac`

Прежде чем открыть конфиг, пара основных терминов:

**NAS (network access server)** - сетевое устройство, к которому мы будем подключаться через tacacs

**NAC (network access client)** - хосты, с которых мы будем подключаться к сетевому оборудованию

**AV (attribute-value)** - пара аттрибут - значение, которые передаются между клиентом и сервером tacacs. Например, privilege level или default ftp-directory.

Теперь откроем конфиг:

`nano /etc/tacacs+/tac_plus.conf`

Сейчас пара полезных ссылок с примерами конфигураций:

[раз](https://itsketch.ru/linux/ubuntu/16-ubuntu-tacacs-server){:target="_blank"}

[два](http://www.techspacekh.com/configuring-tacacs-plus-with-tacacs-plus-user-authentication-on-rhelcentos-7/){:target="_blank"}

И, конечно же, если какие-то вопросы решить не получается, всегда читайте man:

[man tac_plus.conf](http://manpages.ubuntu.com/manpages/trusty/man5/tac_plus.conf.5.html){:target="_blank"}

Простой пример конфига:

```
accounting file = /var/log/tac_plus.acct # файл, где будут храниться все действия, выполняемые пользователем на оборудовании

key = SoMe_KeY_1234 # ключ, который будет использовать NAS для подключения к серверу

user = admin {
     member = admin
     login = des v4FH4KSkwkqy # зашифрованный пароль, о том, как создать - ниже
}

user = test {
     member = guest
     login = des CAjOONkQeROwy
}
# по умолчанию, для группы guest запретим всё, кроме отдельно взятых команд
group = guest {
     default service = deny
     service = exec {
     priv-lvl = 15
     }
     cmd = system-view {
           permit .*
     }
     cmd = display {
           permit .*
     }
     cmd = stelnet {
           permit .*
     }
     cmd = telnet {
           permit .*
     }
     cmd = quit {
           permit .*
     }
     cmd = ping {
           permit ,*
     }
# по умолчанию, разрешим всё для группы admin
group = admin {
	default service = permit
    service = exec {
    priv-lvl = 15
    }
}
```

Здесь стоит обратить внимание на создание юзеров. Поскольку этот вариант без LDAP, то все юзеры должны быть созданы локально, на сервере.
Создадим юзера и зашифруем пароль:

`adduser test` # можно создать через useradd, но так проще

Теперь переключимся на этого юзера:

`su - test`

Сформируем пароль и внесем хеш в файл конфигурации:

```
tac_pwd
Password to be encrypted: 1234567890
kM4fS7ZB9Djzk
```

После этого описание юзера в файле конфигурации будет выглядеть как-то так:

```
user = test {
        member = admin # название группы, к которой принадлежит пользователь
        login = des kM4fS7ZB9Djzk # только что созданный хеш пароля
}
```

Здесь есть очень важный момент - утилита tac_pwd не считается надежной, если используете пароли > 8 символов, иначе, даже если вы будете использовать пароль > 8 символов, для того, чтобы залогиниться на устройство, достаточно будет ввести первые 8. Еще эта утилита идет в комплекте с тем tacacs+, который из репозиториев.
Если вы удалите этот tacacs+, то утилитой tac_pwd воспользоваться не получится.
Да и, честно говоря, не нужно. Более надежной считается утилита openssl:

`openssl passwd -1 <clear_text_password>`

или так

`openssl passwd -crypt`

Обе комманды нужно вводить из под пользователя, которому нужно установить пароль.

## Tacacs+ с аутентификацией через LDAP

А есть, значит, другой tacacs, тот что поддерживает аутентификацию через PAM, LDAP, Radius, списки доступа для NAC, NAS, гибкое управление группами, большое кол-во регулярок и возможность управлять авторизацией с помощью скриптов.
Если ранее был установлен обычный tacacs+, то теперь его можно смело удалить:

`apt remove tacacs+`

Установим сперва библиотеку для работы с LDAP:

`apt update && apt install`

Заранее создадим дерево каталогов для логирования:

`mkdir -p /var/log/tac_plus/{access,accounting,authentication}`

Проверим:

`tree /var/log/tac_plus`

Теперь скачиваем пакет, вот этот - [DEVEL.201908261951.tar.bz2](http://www.pro-bono-publico.de/projects/src/DEVEL.tar.bz2){:target="_blank"}

Теперь пара ссылок на официальную документацию.

[Здесь общий список проектов от разработчика](http://www.pro-bono-publico.de/projects/){:target="_blank"}

[Здесь Mini-HowTo, как установить и протестировать работу tac_plus](http://www.pro-bono-publico.de/projects/howto-tac_plus-ads.html){:target="_blank"}

Продолжим, распакуем архив и установим необходимые пакеты:

```
cd ~
bzip2 -dc DEVEL.tar.bz2 | tar xvfp -
cd PROJECTS
apt install libpcre3-dev libpcre3-dev libpcre2-dev gcc make
make
```

Если возникнут какие-либо ошибки, либо вы хотите использовать PCRE-регулярки (а их можно использовать), то соберите пакет так:

`./configure --with-pcre`

и теперь повторно

```
make
make install
```

Готово. Теперь немного поправим права на файл конфигурации (разрешим редактирование только из под root, остальным дадим права на выполнение):

`chmod 755 /usr/local/etc/tac_plus.cfg`

Перед тем, как начнем править конфиг, пара очень полезных ссылок по теме:

[официальная документация](http://www.pro-bono-publico.de/projects/tac_plus.html#AEN383){:target="_blank"}. Здесь есть примеры простых конфигураций. Самая полезная ссылка.

[habr](https://habr.com/ru/post/194750/){:target="_blank"} - статья на хабре с примером конфигурации и комментариями.

[пример настройки](https://itsketch.ru/linux/ubuntu/83-tacacs-na-linux-s-domennoj-avtorizatsiej){:target="_blank"}

Правим конфиг. Приведу пример файла конфигурации, в комментариях, что и как работает, а еще то, что включить лично у меня не получилось:

```
#!/usr/local/sbin/tac_plus
id = spawnd { # общее "тело" конфигурации
listen = {
# глобальный список nas и порт, который слушает tacacs (любые nas, 49 tcp port, можно выбрать любой другой)
  address = 0.0.0.0 port = 49
  }
spawn = {
# число инстансов для spawnd
  instances min = 1
  instances max = 10
  }
  background = yes
}
# здесь настроим backend для работы с LDAP
id = tac_plus {
# укажем, куда логировать. Любые логи нужно ротировать, позже настроим для этого logrotate
  access log = /var/log/tac_plus/access/access-%d-%m-%Y.txt
  accounting log = /var/log/tac_plus/accounting/accounting-%d-%m-%Y.txt
  authentication log = /var/log/tac_plus/authentication/authentication-%d-%m-%Y.txt
# mavis - backend для работы с LDAP
# все параметры хорошо описаны здесь - http://www.pro-bono-publico.de/projects/tac_plus.html#AEN2318
  mavis module = external {
  setenv LDAP_SERVER_TYPE = "microsoft"
# LDAP-сервер принимает запросы на порт 389, инкапсулированные в SSL - на порт 636. X.X.X.X - ip-адрес LDAP-сервера
  setenv LDAP_HOSTS = "X.X.X.X:389 X.X.X.X:636"
# указываем имя домена. Например, если ваш домен your.domain, то будет так
  setenv LDAP_BASE = "DC=your,DC=domain"
  setenv LDAP_SCOPE = sub
# парсим по всем пользователям в AD
  setenv LDAP_FILTER = "(&(objectClass=user)(objectClass=person)(sAMAccountName=%s))"
# техонологическая учетка в AD, которую будет использовать mavis. Саму учетку создадим чуть позже.
  setenv LDAP_USER = "tacacsplus@your.domain"
# пароль от технологической учетки
  setenv LDAP_PASSWD = "tacacsplus_password"
# снимаем ограничение с групп в AD
  setenv UNLIMIT_AD_GROUP_MEMBERSHIP = 1
  setenv EXPAND_AD_GROUP_MEMBERSHIP = 0
# важный параметр, благодаря которому можно будет опустить имя домена при аутентификации на устройстве
  setenv AD_GROUP_PREFIX = ""
  setenv REQUIRE_TACACS_GROUP_PREFIX = 0
# подключаем сам perl-модуль
  exec = /usr/local/lib/mavis/mavis_tacplus_ldap.pl
}

# указываем модуль для работы с LDAP. К слову, есть и другие модули
login backend = mavis
user backend = mavis
pap backend = mavis

# формируем список NAS-хостов
host = world {
# разрешим NAS с любыми ip
  address = ::/0
# различные баннеры при аутентификации на устройстве. Работают не в каждом клиенте. Например, работают в securecrt
  welcome banner = "Welcome. Today is %A. \n"
  prompt = "Your actions are recording...\n"
# ключ, который будем использовать при настройке tacacs на NAS-устройствах
  key = "your_key"
# не используем наследование конфигурации от стоящих выше списков
  inherit = no
# настроим дефалтную группу. Пользователи, которые не относятся ни к одной из существующих групп, будут попадать сюда. Для этой группы настрим acl и запретим аутентификацию
  default group = no_login

# если будут проблемы при подключении с одного и того же nac, то можно использовать (сейчас закомментировано):
# single-connection = yes
}

# сформируем еще один список NAS-хостов, для которых будут уникальные права авторизации
host = backbone {
# указываем список NAS ip вашего backbone. Пример:
  address = Y.Y.Y.Y/24,Z.Z.Z.Z
# можно указать в виде файла
# address file = ~/addresses.cidr
# дальше по аналогии со списком world
  welcome banner = "Welcome. Today is %A. \n"
  prompt = "Your actions are recording...\n"
  key = "your_key"
  inherit = no
  default group = no_login
# single-connection = yes
}

# очень полезный acl, которым можно разом закрыть доступ для всех NAC, за пределами этого списка
acl = nacacl {
  nac = X.X.X.X/24
  nac = Y.Y.Y.Y
}

# acl для default_group. Запрещаем аутентифицровать пользователей, которые не принадлежат никакой группе
acl script = no_login {
  deny
}

# применяем acl no_login для группы пользователей no_login
group = no_login {
  acl = no_login
}

# настроим права для групп, а затем добавим в них пользователей
group = TACACS_BACKBONE {
# сообщение при аутентификации на оборудовании
  message = "your text"
# запрещаем все типы сервисов по умолчанию
  default service = deny
# разрешаем аутентифицироваться на оборудовании только NAC из nacacl
  acl = nacacl
# настраиваем разрешения для доступа к определенным командам на NAS-устройствах
  service = shell {
# по умолчанию разрешим все команды
  default command = permit
# запретим передачу аттрибутов
  default attribute = deny
# установим уровень привелегий, по умолчанию
  set priv-lvl = 15
# допустим вам необходимо запретить определенные команды при нахождении в режиме интерфейса. Это делается так (только вот у меня, к сожалению, не заработало, поэтому скрипт закомментирован):
# script = {
#       if (cmd == "") permit
#
#       if (cmd =~ "^interface ") {
#           message = "Context has been set. All commands doesn't work for this interface."
#           context = GE
#           permit
#       }
#       else if (cmd =~ "^interface"){
#           message = "Context has been reset."
#           context = ""
#           permit
#       }
#       if (context == GE) {
#           if (cmd =~ "^shut") deny
#           if (cmd =~ "^undo shut") permit
#           deny
#        }
#       }

# команд на NAS много, поэтому запрещать их по отдельности не очень удобно, например, так:
cmd = undo {
    permit "^debbuging"
    permit "^packet-capture"
    deny .*
}

# можно использовать скрипты, например, так:
# запретим все команды, которые начинаются с символов в квадртаных скобках
  script = {
    if (cmd =~ "^[a,e,f,i,g,h,k,l,m]") {
    deny
    }
  }
# разрешим команды, начинающиеся на ba или br, запретим все остальные, начинающиеся на b:
script = {
    if (cmd =~ "^b[a,r]") {
    permit
    }
    else if (cmd =~ "^b") {
    deny
    }
  }
# разрешим команды, начинающиеся на deb, dir, всё, что входит в display, запретим остальные, начинающиеся на d
  script = {
    if (cmd =~ "^deb" || cmd =~ "^dir" || cmd =~ "^display") {
    permit
    }
    else if (cmd =~ "^d") {
    deny
    }
  }
 }
}
group = TACACS_HELPDESK {
# можно прикрутить права другой группы, просто в качестве примера:
# member = TACACS_ADMIN
  message = "your text"
  default service = deny
  acl = nacacl
  service = shell {
  default command = permit
  default attribute = deny
  set priv-lvl = 15
# для этой группы разрешим все команды на NAS-устройствах, но запретим bgp, ospf, isis
  script = {
    if (cmd =~ "^bgp" || cmd =~ "^ospf" || cmd =~ "^isis") {
    deny
    }
    else permit
  }
 }
}
# настроим группу администраторов, где разрешим всё
group = TACACS_ADMIN {
 message = "your text"
 default service = permit
 acl = nacacl
 service = shell {
 default command = permit
 default attribute = permit
 set priv-lvl = 15
 }
}

# добавим пользователей, которые будут аутентифицироваться через LDAP. В AD заведем этих пользователей чуть позже
user = user1 {
  member = TACACS_ADMIN
}

user = user2 {
# для хостов из списка backbone применяем права группы tacacs_backbone
 member = TACACS_BACKBONE@backbone
# для всех остальных хостов применяем права группы tacacs_helpdesk
 member = TACACS_HELPDESK
}

# не обязательно использовать LDAP для аутентификации. Можно использовать локальных пользователей
user = local_user {
 member = TACACS_ADMIN
# пароль, который дает утилита openssl passwd -crypt. Применение описано выше, в основном тексте
 login = crypt s8FHJQOEIWkqlzx
}
# manual - http://www.pro-bono-publico.de/projects/tac_plus.html#AEN1299
```

Теперь добавим учетки на LDAP-сервере.
*Средства администрирования - Пользователи и компьютеры.*

Для начала создадим технологическую учетную запись для mavis:
*действие - создать - пользователь. На вкладке "Учетная запись" ставим галочки "Запретить смену пароля пользователем", "Срок действия пароля не ограничен"*

![ldap-user]({{ site.url }}{{ site.baseurl }}/assets/img/posts/tacacs/ldap-user.jpg)

В Active Directory создаем группы, которые указали в файле конфигурации: tacacs_admin, tacacs_backbone, tacacs_helpdesk.
Tac Plus отрезает префикс «tacacs» при соотношении группы, указанной в AD, группе в конфиге и переводит оставшиеся символы в верхний регистр.
Таким образом, например, группе в AD, tacacsadmin, будет соответвствовать группа в tac_plus.cfg - ADMIN, а группе в AD, tacacsbackbone, группа в tac_plus.cfg - BACKBONE (мы же изменили данное поведение, указав атрибуты: AD_GROUP_PREFIX и REQUIRE_TACACS_GROUP_PREFIX в конфиге. Теперь можно создавать группы по с названиями аналогичными файлу конфигурации).
По этой же причине стоит использовать большие буквы в названиях групп, в файле конфигурации tac_plus.cfg.

Теперь проверим конфиг на ошибки:

`/usr/local/sbin/tac_plus -P /usr/local/etc/tac_plus.cfg`

Проверим mavis, должен вернуться ACK (проверяем от любого заведенного в AD юзера):

`/usr/local/bin/mavistest -d -1 /usr/local/etc/tac_plus.cfg tac_plus TACPLUS <user> <password>`

Поскольку скрипт инициализации написано для sysv, скопируем его, куда положено:

`cp ./PROJECTS/tac_plus/extra/etc_init.d_tac_plus /etc/init.d/tac_plus`

Немного поправим права:

```
chmod 755 /etc/init.d/tac_plus
chown root:root /etc/init.d/tac_plus
```

Рестартуем tac_plus

```
/etc/init.d/tac_plus stop
/etc/init.d/tac_plus start
```

## Дебаг

Проверим, что сервис слушает 49 порт:

`netstat -nlp | grep tac_plus`

Всегда можно снять дамп и посмотреть, есть ли какие-то пакеты:

```
tcpdump -nn port 49
tcpdump -nn port 49 -w ~/dump.cap # с записью в файл
```

Дебаг запросов, которые обрабатывает сервер:

`/usr/local/sbin/tac_plus -d 4088 -fp /var/run/tac_plus.pid /usr/local/etc/tac_plus.cfg`

Дебагу посвящен отдельный раздел в документации:

[Debugging](http://www.pro-bono-publico.de/projects/tac_plus.html#AEN2594){:target="_blank"}

## Предусмотрим автозагрузку

Конечно, можно стартовать сервис классическими */etc/init.d/tac_plus start* и */etc/init.d/tac_plus stop*, но, подразумевается, что после рестарта системы сервис поднимется автоматически.
Начнем с того, что Ubuntu 19.04, как и большинство современных дистрибутивов Linux, используют подсистему инициализации systemd, которая очень неплохо работает с init-скриптами, написанными для более старой подсистемы sysv.
Итак, для инициализации сервиса tac_plus, который мы будем использовать, увы, написан не systemd unit, а sysv init-скрипт. Найти такой скрипт можно здесь (мы его сами туда скопировали) - /etc/init.d, наш - /etc/init.d/tac_plus (этот для варианта с ldap, а для варианта без ldap будет tacacs_plus). Чтобы добавить наш tac_plus сервер в автозагрузку (а скорее всего его там нет, т.е. после рестарта он не запустится) можно изучить документацию по systemd и написать для него собственный unit, либо можно воспользоваться уже написанным sysv init-скриптом (ниже будет пара ссылок о написании systemd unit'ов). Выберем второй вариант:

1) В systemd предусмотрена совместимость со скриптами sysv из коробки. Для этого используется systemd-sysv-generator. Попробуем воспользоваться просто запустив sysv-скрипт не с помощью service, а с помощью systemctl:

`systemctl start tac_plus # стартуем сервис`

`systemctl enable tac_plus # добавляем сервис в автозагрузку`

Если все прошло успешно, то можем проверить статус:

`systemctl status tac_plus`

Должны увидеть такое сообщение:

```
  tac_plus.service - SYSV: Starts and stops the tac_plus server process.
   Loaded: loaded (/etc/init.d/tac_plus; generated)
   Active: active (running) since Tue 2019-10-15 13:27:28 MSK; 1 day 11h ago
     Docs: man:systemd-sysv-generator(8)
  Process: 910 ExecStart=/etc/init.d/tac_plus start (code=exited, status=0/SUCCESS)
    Tasks: 3 (limit: 4661)
   CGroup: /system.slice/tac_plus.service
           ├─1049 tac_plus: 0 connections, accepting up to 600 more
           ├─1053 tac_plus: 0 connections
           └─1054 perl /usr/local/lib/mavis/mavis_tacplus_ldap.pl

Oct 15 13:27:28 tacacs tac_plus[950]: startup (version 201908261951)
Oct 15 13:27:28 tacacs tac_plus[1048]: startup (version 201908261951)
Oct 15 13:27:28 tacacs tac_plus[1049]: epoll event notification mechanism is being used
Oct 15 13:27:29 tacacs tac_plus[910]: Starting tac_plus: done.
Oct 15 13:27:28 tacacs systemd[1]: Started SYSV: Starts and stops the tac_plus server process..
Oct 15 13:27:28 tacacs tac_plus[1049]: bind to [0.0.0.0]:49 succeeded
Oct 15 13:27:28 tacacs tac_plus[1053]: - Version 201908261951 initialized
Oct 15 13:27:28 tacacs tac_plus[1053]: epoll event notification mechanism is being used
```

В выводе видно, что systemd запустил systemd-sysv-generator и преобразовал sysv-скрипт /etc/init.d/tac_plus в systemd unit.
Теперь можем взглянуть на полученный systemd unit:

`cat /run/systemd/generator.late/tac_plus.service`

Выглядит это как-то так:

```
# Automatically generated by systemd-sysv-generator

[Unit]
Documentation=man:systemd-sysv-generator(8)
SourcePath=/etc/init.d/tac_plus
Description=SYSV: Starts and stops the tac_plus server process.

[Service]
Type=forking
Restart=no
TimeoutSec=5min
IgnoreSIGPIPE=no
KillMode=process
GuessMainPID=no
RemainAfterExit=yes
ExecStart=/etc/init.d/tac_plus start
ExecStop=/etc/init.d/tac_plus stop
ExecReload=/etc/init.d/tac_plus reload
```

Перезагружаем сервер, проверяем, все ли хорошо(в выводе должны увидеть процесс tac_plus):

`ps -e | grep tac`

2) Вообще, чтобы systemd-sysv-generator отработал корректно, sysv-скрипт должен иметь LSB заголовок одними из первых строчек, хотя это не совсем верно, и он вполне неплохо распознает более ограниченные старые заголовки комментариев RedHat (description:, pidfile: и т. д.), которые есть в /etc/init.d/tac_plus.
Однако, если systemd-sysv-generator все же подвел, попробуйте добавить LSB в начало файла tac_plus и повторить попытку:

```
### BEGIN INIT INFO
 # Default-Start: 2 3 4 5 
 # Default-Stop: 0 1 6 
### END INIT INFO
```

Цифрами здесь указаны runlevel для sysv, на которых будет стартовать и останавливаться init-скрипт. Они, кстати, находятся там же (/etc/rc3.d, /etc/rc4.d, /etc/rc5.d и т.д), а скрипты с  буквами S и K в начале стартуют и останавливаются скрипты (подробнее о sysv по ссылкам ниже).
Еще стоит сказать, что стандартными способами добавления сервиса в автозагрузку в sysv были использование файла /etc/rc.local (в systemd он остался для совместимости, но не включен в автозагрузку, по умолчанию) и использование утилиты update-rc.d, которая раскидывает ваш init-скрипт по нужным runlevel.

3) Если добавление LSB заголовка не помогло (это мы делали в пункте 2), то давайте напишем свой systemd unit и добавим его в автозагрузку. Ну как свой, в существующем коде tacacs копаться мы не будем, а немного считерим и воспользуемся нашим /etc/init.d/tac_plus (добавим команды запуска, остановки и рестарта). Хоть это и не совсем красиво, но, вполне себе, практикуется.
Итак, существует несколько директорий, где могут храниться unit'ы.
-  */lib/systemd/system/ *# здесь хранятся копии всех unit'ов. Эти файлы могут быть запущены или остановлены самим сервисов во время его работы. Вносить изменения в эти файлы очень нежелательно. Для этого есть другая директория:
-  */etc/systemd/system/ *# именно здесь и следует создавать systemd unit. К тому же эта директория имеет приоритет над остальными
-  */run/systemd/system/* # файлы в этом каталоге имеют приоритет между /etc/systemd/system и/lib/systemd/system. К тому же systemd использует эту директорию для создания временных файлов в процессе работы. Рестарт сервера очищает каталог.

Создадим наш unit в /etc/systemd/system/

`nano /etc/systemd/system/tac_unit.service`

Добавим следующее:

```
[Unit]
Description=Tacacs Plus Service # описание unit'а

[Service]
Type=forking # что служба запускается однократно и процесс разветвляется с завершением родительского процесса. Подробности есть по ссылкам ниже
PIDFile=/var/run/tac_plus.pid # для systemd некритично наличие pid процесса, но мы можем указать, какой pid отслеживать

User=root # пользователь и группа, под которыми запускаем сервис
Group=root

OOMScoreAdjust=-100 # понизим вероятность kill'а сервиса вследствие нехватки памяти и срабатывания механизма OOM, -1000 полный запрет (например, sshd

# старт, стоп и рестарт сервиса
ExecStart=/etc/init.d/tac_plus start
ExecStop=/etc/init.d/tac_plus stop
ExecReload=/etc/init.d/tac_plus restart

Restart=always # systemd будет рестартовать наш сервис, если он вдруг перестанет работать. Управляется через PID файл

[Install]
WantedBy=multi-user.target # уровень запуска. Используем привычный для сервера runlevel3 (многопользовательский режим без графики)
```

Дадим unit-файлу права на выполнение:

`chmod +x /etc/systemd/system/tac_unit.service`

Теперь запустим наш unit:

`systemctl start tac_unit.service`

Добавим unit в автозагрузку:

`systemctl enable tac_unit.service`

Проверим, что unit-файл в автозагрузке:

```
systemctl-list-unit-files | grep tac # должно быть enabled в выводе
systemctl is-enabled tac_unit
```

Если вносите какие-то изменения в unit-файл, то systemd должен его снова изучить:

`systemctl daemon-reload`

- Обязательно рестартуем сервер и проверяем, работает ли автозагрузка для нашего tac_plus:

`ps -e | grep tac # после рестарта`

Кстати systemctl неплохо логирует в journalctl. Посмотреть логи автозагрузки для сервиса/unit'а можно так:

```
journalctl -u tac_plus
journalctl -u tac_unit
```

### Полезные ссылки:
#### Автозагрузка в Linux:

[раз](https://losst.ru/avtozagruzka-linux){:target="_blank"}

#### Управление службами Linux в systemd:

[раз](https://losst.ru/upravlenie-sluzhbami-linux){:target="_blank"}

#### Делаем systemd-unit:

[раз](https://habr.com/ru/company/southbridge/blog/255845/){:target="_blank"}

[два](https://www.shellhacks.com/ru/systemd-service-file-example/){:target="_blank"}

[три](https://oss-it.ru/171){:target="_blank"}

[четыре](https://linux-notes.org/pishem-systemd-unit-fajl/){:target="_blank"}

#### Делаем sysv init-скрипт:

[раз](https://linux-notes.org/pishem-init-skript/){:target="_blank"}

#### Документация:
#### update.rc.d для работы с автозагрузкой в sysv:

[раз](http://manpages.ylsoftware.com/ru/update-rc.d.8.html){:target="_blank"}

#### systemd.service:

[раз](https://www.freedesktop.org/software/systemd/man/systemd.service.html){:target="_blank"}

`man systemd.service`

#### systemd.unit:

[раз](https://www.freedesktop.org/software/systemd/man/systemd.unit.html){:target="_blank"}

`man systemd.unit`

## Еще немного

Настроим history и время на сервере, чтобы было удобнее работать:
- Открываем файл с настройками работы в терминале:

`nano ~/.bashrc`

- Добавляем в конец файла строчки:

```
export PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND$'\n'}history -a; history -c; history -r;" # синхронизировать history между всеми терминалами
export HISTCONTROL=ignoredups # игнорировать в выводе history повторяющиеся комманды
export HISTTIMEFORMAT='%F %T ' # добавить в вывод history штамп времени %T и шатмп даты %F
```

- Перечитываем конфигурацию bash:

`exec bash`

- Установим время

Синхронизируем время по сети. Сперва найдем нужный часовой пояс:

`timedatectl list-timezones | grep Moscow`

Теперь установим

`sudo timedatectl set-timezone 'Europe/Moscow'`

Проверим время:

`date`

## Шаблоны для оборудования huawei
#### Для коммутаторов S33, S53, S93:
```
system-view
ssh authentication-type default password
hwtacacs-server template <hwtacacs_template_name>
hwtacacs-server authentication <X.X.X.X>
hwtacacs-server authorization <X.X.X.X>
hwtacacs-server accounting <X.X.X.X>
hwtacacs-server source-ip <your_loopback>
hwtacacs-server shared-key cipher <your_hwtacacs_key>
undo hwtacacs-server user-name domain-included
q
aaa
authentication-scheme default
  authentication-mode local hwtacacs
q
authentication-scheme hwtacacs_scheme
  authentication-mode hwtacacs local 
q
 authorization-scheme hwtacacs_nxtt
  authorization-mode hwtacacs local
  authorization-cmd 1 hwtacacs local
  authorization-cmd 3 hwtacacs local
  authorization-cmd 15 hwtacacs local
q
 accounting-scheme <your_hwtacacs_scheme>
  accounting-mode hwtacacs
  accounting start-fail online
  accounting interim interval 1
q
domain default_admin
  authentication-scheme <your_hwtacacs_scheme>
  accounting-scheme <your_hwtacacs_scheme>
  authorization-scheme <your_hwtacacs_scheme>
  hwtacacs-server <hwtacacs_template_name>
q
 recording-scheme <your_hwtacacs_scheme>
  recording-mode hwtacacs <hwtacacs_template_name>
q
 cmd recording-scheme <your_hwtacacs_scheme>
q
q
save
y
```

#### Для CX, ATN, NE:
```
system-view
 ssh authentication-type default password
hwtacacs-server template <hwtacacs_template_name>
 hwtacacs-server authentication <X.X.X.X>
 hwtacacs-server authorization <X.X.X.X>
 hwtacacs-server accounting <X.X.X.X>
 hwtacacs-server source-ip <your_loopback>
 hwtacacs-server shared-key cipher <your_hwtacacs_key>
 hwtacacs-server user-name original
q
aaa
authentication-scheme default
  authentication-mode local hwtacacs
q
authentication-scheme <your_hwtacacs_scheme>
  authentication-mode hwtacacs localhwtacacs_nxtt
q
 authorization-scheme hwtacacs_nxtt
  authorization-mode hwtacacs local
  authorization-cmd 1 hwtacacs local
  authorization-cmd 3 hwtacacs local
  authorization-cmd 15 hwtacacs local
q
 accounting-scheme <your_hwtacacs_scheme>
  accounting-mode hwtacacs
  accounting interim interval 1
  accounting start-fail online
commit
q
domain default_admin
  authentication-scheme <your_hwtacacs_scheme>
  accounting-scheme <your_hwtacacs_scheme>
  authorization-scheme <your_hwtacacs_scheme>
  hwtacacs-server <hwtacacs_template_name>
q
 recording-scheme <your_hwtacacs_scheme>
  recording-mode hwtacacs <hwtacacs_template_name>
q
 cmd recording-scheme <your_hwtacacs_scheme>
q
commit
q
save
y
```

#### Для firewall Eudemon, USG (здесь обязательно заводить юзеров локально):
```
sy
hwtacacs-server template <hwtacacs_template_name>
 hwtacacs-server authentication <X.X.X.X>
 hwtacacs-server authorization <X.X.X.X>
 hwtacacs-server accounting <X.X.X.X>
 hwtacacs-server source-ip <your_loopback>
 hwtacacs-server shared-key cipher <your_hwtacacs_key>
q 
aaa
 authentication-scheme <your_hwtacacs_scheme>
  authentication-mode hwtacacs local
q
 authorization-scheme <your_hwtacacs_scheme>
  authorization-mode  hwtacacs local
  authorization-cmd 1 hwtacacs local
  authorization-cmd 3 hwtacacs local
  authorization-cmd 15 hwtacacs local
q
 accounting-scheme <your_hwtacacs_scheme>
  accounting-mode hwtacacs
  accounting start-fail online
q
 recording-scheme <your_hwtacacs_scheme>
  recording-mode hwtacacs <hwtacacs_template_name>
q
cmd recording-scheme <your_hwtacacs_scheme>
 domain hwtacacs
  authentication-scheme <your_hwtacacs_scheme>
  hwtacacs-server <hwtacacs_template_name>
  service-type administrator-access
  reference user current-domain
  new-user deny-authentication
q 
  manager-user user1
  level 15
  service-type ssh terminal web
  authentication-scheme <your_hwtacacs_scheme>
  hwtacacs-server <hwtacacs_template_name> 
  q
   manager-user user2
  level 15
  service-type ssh terminal web
  authentication-scheme <your_hwtacacs_scheme>
  hwtacacs-server <hwtacacs_template_name> 
  q
  bind manager-user user1 role system-admin
  bind manager-user user2 role system-admin
  authentication-scheme default
  authentication-mode local hwtacacs
  q
  q
ssh authentication-type default password
quit
save
y
```
