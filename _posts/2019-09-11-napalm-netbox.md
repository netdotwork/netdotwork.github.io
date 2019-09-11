---
layout: post
title: Napalm + netbox
summary: Очень добрый инструмент учета, netbox, можно сделать еще добрее. Сегодня прикрутим napalm driver к netbox и соберем данные с оборудования huawei.
featured-img: typewriter
categories: Other Networking Code
tags: [ netbox, napalm ]
---
Очень добрый инструмент учета, netbox, можно сделать еще добрее. Сегодня прикрутим napalm driver к netbox и соберем данные с оборудования huawei.

Netbox - бесплатный, открытый IPAM + DCIM. Вот ссылочки: https://netbox.readthedocs.io/en/stable/
https://github.com/netbox-community

В netbox есть REST API, т.е. хранимую в нем информацию можно забирать, обрабатывать и складывать обратно. Все это + аутентификацию на сетевых устройствах, netbox может выполнять с помощью библиотеки napalm.

Установим napalm на сервер с netbox.
Для начала выберем нужный драйвер. 
Есть официальная страница - https://napalm-automation.net/, здесь же, в самом низу, ссылка на гитхаб - https://github.com/napalm-automation с библиотеками под разные ОС. Но здесь только то, что поддерживается официально. Перечень таких девайсов можно ещё и здесь найти - https://napalm.readthedocs.io/en/latest/support/. Huawei нет :(
Посмотрим гитхаб коммьюнити - https://github.com/napalm-automation-community. 
Дело в том, что сам драйвер представляет из себя универсальный API для управления "коробками" любых вендоров. А как управлять - решаете сами. Например, хотите написать парсер для чего-то своего или добавить новый метод, переписываете только одну библиотеку в директории custom_napalm. Вот здесь подробнее - https://napalm.readthedocs.io/en/latest/tutorials/extend_driver.html.

Итак, на странице коммьюнити есть почти то, что нужно - [napalm_ce](https://github.com/napalm-automation-community/napalm-ce){:target="_blank"}. Это драйвер для huawei cloudengine. Установим согласно инструкции, проверим на девайсах серий S и NE. Актуально и для других серий (CX, Eudemon, USG):
через установщик python-пакетов, pip ([pip - The Python Package Installer](https://pip.pypa.io/en/stable/)):
`pip install napalm-ce`

Сейчас napalm будет корректно работать только с Huawei CE. Проверим по инструкции на странице проекта -  [README.md](https://github.com/napalm-automation-community/napalm-ce/blob/master/):
выбираем любой доступный на странице метод, например, get_lldp_neighbors()

```
python
from napalm import get_lldp_neighbors

driver = get_network_driver("ce")
device = driver(hostname='192.168.1.1', username='admin', password="Huawei123", optional_args = {'port': 22})
device.open()
device.get_lldp_neighbors()
device.close()
```

Все, что относится к optional_args можно изучить [здесь](https://napalm.readthedocs.io/en/latest/support/#optional-arguments)

Разумеется, на устройствах должен быть включен lldp. Если нет, включаем глобально на huawei:
`lldp enable`

Теперь переходим в netbox, добавляем платформу:
Devices - Platforms - ADD - называем Huawei VRP, в поле NAPALM driver указываем ce.
Создаем устройство и привязываем платформу:
Devices - ADD - в поле Platform выбираем Huawei VRP. Здесь же нужно выбрать Primary IPv4, который используется для управления.

После этого можем взглянуть как выглядит запрос через rest api netbox. Открываем в браузере:
http://netbox.domain/api/dcim/devices/119/napalm/?method=get_lldp_neighbors
где
```
netbox.domain - ip-адрес сервера, где хостим netbox,
119 - id девайса
get_lldp_neighbors - один из доступных в ce методов.
```
Интерфейсы в карточке устройства должны совпадать с этим выводом, т.е. для NE, например, так - GigabitEthernet4/1/21, а для S-серии, например, так - GE3/0/1.
В карточке устройства теперь доступны вкладки Status, LLDP Neighbors, Configuration, но у нас не Huawei CE, поэтому информации либо нет, либо она некорректная. Поправим это:
у меня netbox на Ubuntu, поэтому переходим в /usr/local/lib/python3.6/dist-packages/napalm_ce, открываем ce.py. Здесь все парсеры cli-выводов Huawei CE.
Оригинальный ce.py можно открыть, например, [здесь](https://github.com/napalm-automation-community/napalm-ce/blob/master/napalm_ce/ce.py). Дальше будет только исправленный код.
Для начала исправим вывод метода get_lldp_neighbors:

```
def get_lldp_neighbors(self):

        results = {}
        command = 'display lldp neighbor brief'
        output = self.device.send_command(command)
        re_lldp = r"(?P<local>\S+)\s+(?P<hostname>\S+)\s+(?P<port>\S+)\s+\d+\s+"
        match = re.findall(re_lldp, output, re.M)
        for neighbor in match:
            local_iface = neighbor[0]
            if local_iface not in results:
               results[local_iface] = []
               
            neighbor_dict = dict()
            neighbor_dict['hostname'] = py23_compat.text_type(neighbor[1])
            neighbor_dict['port'] = py23_compat.text_type(neighbor[2])
        results[local_iface].append(neighbor_dict)
        return results
```
Проверяем корректность вывода так:
http://netbox.domain/api/dcim/devices/119/napalm/?method=get_lldp_neighbors и на странице устройства, на вкладке LLDP Neighbors. Выглядит это, например, так:
![lldp_neighbors]({{ site.url }}{{ site.baseurl }}/assets/img/posts/lldp_neighbors.png)

Теперь поправим вкладку Configuration, добавим вывод Startup config:
```
    def get_config(self, retrieve='all'):
        if retrieve.lower() in ('running', 'all'):
            command = 'display current-configuration all'
            config['running'] = py23_compat.text_type(self.device.send_command(command))
        if retrieve.lower() in ('startup', 'all'):
            command = 'display saved-configuration last'
            config['startup'] = py23_compat.text_type(self.device.send_command(command))
            pass
        return config
```

На вкладке Status заполним поля Model, Serial Number, OS Version, Uptime:
```
    def get_facts(self):
        # default values.
        vendor = u'Huawei'
        uptime = -1
        serial_number, fqdn, os_version, hostname, model = (u'Unknown', u'Unknown', u'Unknown', u'Unknown', u'Unknow$

        # obtain output from device
        show_ver = self.device.send_command('display version')
        show_hostname = self.device.send_command('display current-configuration | inc sysname')
        show_int_status = self.device.send_command('display interface brief')
        show_esn = self.device.send_command('display esn')

        # serial_number/VRP version/uptime/model
        for line in show_ver.splitlines():
            if 'VRP (R) software' in line:
                search_result = re.search(r"\((?P<serial_number1>[NSE]\S+)\s+(?P<os_version>V\S+)\)", line)
                if search_result is not None:
                os_version = search_result.group('os_version')

            if 'uptime is' in line:
                search_result = re.search(r"[HQ]\S+\s+\S+\s+", line)
                if search_result is not None:
                model = search_result.group(0)
                uptime = self._parse_uptime(line)
                break

        if 'sysname ' in show_hostname:
            _, hostname = show_hostname.split("sysname ")
            hostname = hostname.strip()

            command = 'display esn'
            serial_number = py23_compat.text_type(self.device.send_command(command))

        return {
            'uptime': int(uptime),
            'vendor': vendor,
            'os_version': py23_compat.text_type(os_version),
            'serial_number': py23_compat.text_type(serial_number),
            'model': py23_compat.text_type(model),
            'hostname': py23_compat.text_type(hostname),
            'fqdn': fqdn,  # ? fqdn(fully qualified domain name)
            'interface_list': interface_list
        }
```

Это не все, но уже стало гораздо интереснее. Теперь netbox - не только IPAM + DCIM, но и, даже, немного OSS.

Полезные ссылки
[Adding Cisco IOS support to NAPALM (Network Automation and Programmability Abstraction Layer with Multivendor support)](https://projectme10.wordpress.com/2015/12/07/adding-cisco-ios-support-to-napalm-network-automation-and-programmability-abstraction-layer-with-multivendor-support/])
[Accessing NAPALM via the NetBox API](https://www.youtube.com/watch?v=ha2kNRiO_Ng&t=389s)
