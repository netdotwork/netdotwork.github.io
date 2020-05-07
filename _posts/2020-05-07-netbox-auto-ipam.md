---
layout: post
title: autoIPAM/DCIM tool для NetBox
summary: Пробуем автоматизировать процесс обновления IPAM/DCIM NetBox.
featured-img:
categories: Linux Networking Code Management
tags: [ python, bash, netbox ]
---
Сложно поддерживать IPAM [NetBox](https://github.com/netbox-community/netbox){:target="_blank"} в актуальном состоянии, если вы делаете это сами, вручную.
А если потребности не ограничены IPAM и вы пытаетесь держать в порядке DCIM NetBox?

Нужен инструмент, который будет:
- собирать данные и добавлять в БД NetBox
- проверять ранее добавленные в БД NetBox данные и исправлять при необходимости
- работать с планировщиком

Данные можно собирать с самих сетевых устройств, с помощью [netmiko](https://github.com/ktbyers/netmiko){:target="_blank"}.
Netmiko поддерживает большое число [платформ](https://ktbyers.github.io/netmiko/PLATFORMS.html){:target="_blank"} и легко [интегрируется с TextFSM](https://pynet.twb-tech.com/blog/automation/netmiko-textfsm.html){:target="_blank"}, что полезно для CLI-устройств.

Это не быстро, но можно использовать потоки, с помощью concurrent.futures и threading.

Что касается способов работы с API NetBox, то можно воспользоваться [SDK Pynetbox](https://github.com/digitalocean/pynetbox){:target="_blank"}.
Получить список endpoint'ов при этом не составит труда, NetBox имеет специфицированный API  - [подробнее](https://linkmeup.ru/blog/530.html#WAYS){:target="_blank"}.

Готовый инструмент с подробным `README` [здесь](https://github.com/netdotwork/netbox_resolver){:target="_blank"}.
В списке поддерживаемых платформ пока только `Huawei VRP`.

Осталось закрыть вопрос с планировщиком.

- - -

Нам потребуется Python 3.7 - установим в виртуальном окружении:
- [так](https://github.com/netdotwork/pyneng-my-exercises/blob/master/virtualenv_python.md){:target="_blank"}
- [или так](https://pyneng.github.io/docs/venv/){:target="_blank"}

Подготовим yaml-конфигуратор с набором параметров. Например, `devices.yaml`:

```
- netbox: http://netbox_domain_name_or_ip/
  token: netbox_token
  device_type: huawei
  ip_list: ["10.1.1.1-5"]
  threads: True
  max_workers: 5
  inventory: True
  username: user
  password: password
- netbox: http://netbox_domain_name_or_ip/
  token: netbox_token
  device_type: huawei
  ip_list: ["10.2.2.140,148,156"]
  threads: True
  max_workers: 3
  inventory: True
  username: user
  password: password
```

Пишем `run.py`:
```
# предположим, это путь до python3.7 в только что созданном виртуальном окружении
#!/home/user/virtenvs/py3.7/bin/python3.7
import yaml
from vendor_selector import VendorSelector
# yaml-параметры будем передавать как аргументы
from sys import argv

# запускаем как run.py 0, где 0 - словарь из devices.yaml
with open("devices.yaml") as f:
    devices = yaml.safe_load(f)
    params_number = int(argv[1])
    obj = VendorSelector(**devices[params_number])
    obj.send_ip_list()

```

Пишем `run.sh` для запуска в crond:

```
#/bin/bash

# переключаемся на виртуальное окружение с python3.7
source /home/user/virtenvs/py3.7/bin/activate
# устанавливаем максимальное число запущенных параллельно процессов
BG_MAX_PROCESS=2
BG_PROCESS=0
MY_PID=$$
# кол-во словарей с параметрами в devices.yaml = общее кол-во запущенных процессов
PARAMS_COUNTER=$(( $(awk '/^- /{print $0}' devices.yaml | wc -l) - 1 ))

for (( i = 0; i <= $PARAMS_COUNTER; i++ ))
do
        BG_PROCESS=$((`ps ax -Ao ppid | grep $MY_PID | wc -l`))
        while [ $BG_PROCESS -gt $BG_MAX_PROCESS ]
        do
                BG_PROCESS=$((`ps ax -Ao ppid | grep $MY_PID | wc -l`))
                sleep 1
        done
        echo TASK NUMBER: $i FROM $PARAMS_COUNTER
		# запускаем run.py с соотв. аргументом как фоновый процесс
        /home/user/virtenvs/py3.7/bin/python /path_to_run.py/run.py $i &
done
printf "\nTASKS FINISHING...\n"
BG_PROCESS=$((`ps ax -Ao ppid | grep $MY_PID | wc -l`))
# ожидаем пока выполнятся последние 2 процесса
# уведомляем о завершении всех процессов
printf "LAST $BG_PROCESS PROCESSES\n"
while [ $BG_PROCESS -gt 1 ]
do
        BG_PROCESS=$((`ps ax -Ao ppid | grep $MY_PID | wc -l`))
        #clear
        #echo LAST $BG_PROCESS PROCESSES
        sleep 1
done
printf "\nALL TASKS HAVE DONE\n"
```

Добавляем в crontab, запускаем каждый день в 00:01, а лог сохраняем в /tmp/cronlog.txt:

`chmod +x /path_to_run.sh/run.sh`

`crontab -e`

`01      00      *       *       *       bash /path_to_run.sh/run.sh 2>&1 /tmp/cronlog.txt`
