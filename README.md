# Часть 4: Взаимодействие с Google таблицами

## Библиотека Google-spreadsheet для NPM

[Документация библиотеки google-spreadsheet](https://theoephraim.github.io/node-google-spreadsheet/#/)
 
### Настройка авторизации

[Google cloud console](https://console.cloud.google.com/)

## Пример Google таблицы для этой версии

[Ссылка](https://docs.google.com/spreadsheets/d/1QvZ8_1LKSk6oagzHU2OJaTtdLQfds8_2xY7wtFd6rGc)

## Пример переменных окружения

```
export MONEY_MGR_EMAIL="money-mgr-tg-bot@money-mgr-34524365346.iam.gserviceaccount.com"

export MONEY_MGR_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0c5uIxX\nClt/xaziYpEwN3ojQ47MGf7E7oqLQhriM6VnR1YBD8IBedpYNkQRZS+l78hjLg2DXVciRjVOQJncnMSPB2mG1yKgsz7tRMkul3wz5\nt7JHp4hNWXvCZLFEy3Z4qk6X5B+RQa1sr5EI5e/X0rP7hO1z+be5dAlof9whkIJE\nBqhmb1uujHV/7RKLPrWoRKYz9iocGyevn9sr5Q+bKflUm4DefKgVoEpmO6ongJCo\n8/6Rg4dO/UZMPHEDxDvKh0UrTFj7nRtnKVauIW4/ELWNA3z9uXIo3fEaZch3Msep\n0RIBHDHpAgMBAAECggEAUnYmFtly4LT+ipUwxsl1Dq2spjhb5Kg7tT7mpekbm1mg\ntr1KHM4SCby01oi9m/rXcFykLESs/1RNBB0ZgFfRA7U49UXoifAoGAMnuH\nMsHx9Xy3sg+9+7hi4MVbt9uuCzW7HvwsK8gCV\nE6/g41/vu0/pZuOm/1hIg3eMaY+1WEc9Qprb8Bja2uBlrlmoM2FHv/MEK2d56dTP\ntE5k39GHDt1Rcu8tQx2OAYygwbx1aWBbfr3+tuUCgYBGYaLo2W2Zj2jvKJIgL1Xj0ju5BB/XtMfM1rQu26Vl4dO/UZMPHEDxDvKh0UrTFj7nRtnKVauIW4/ELWNA3z9uXIo3fEaZch3Msep\n0RIBHDHpAgMBAAECggEAUnYmFtly4LT+ipUwxsl1Dq2spjhb5Kg7tT7mpekbm1mg\ntr1KHM4SCby01oi9m/rXc+eDWruKFsyQ0SnQeDMPAqwwrd2apjg69V6GRaHMblSf\nPm3ItK3Jha7XtRPchooWgXVjswMdGDHpcYgNYkpIlKMrYT1KcrHPrI7QGZnVuD0i\nPLkH7fhFqjgX+MRTzK6Z15ZX2+FS5UL2/HDucebEE/k3kyIfzkHkmt/RkGsiPrUUvhPrLrjc/HEM8SDKwF5VUTHILHlTL+ZAdMWdX/cJclf1rmG62oPlKqTXTfWRH/8xdURcUuuMi4UoUAaCA+JXYLb41T2/P6FlOpcqiHMP4PSx1Su1z3\n52m7SNxxXEuJ6idLGwy3iHf/IGRCvhf6NBJlPWsueXewAAFRGW+Uij2dRCG1VHzt\n0OPclTTygwKBgCDlVk0IKH/EBBchHMvTDqUMxoRCrJL7eXxAZ+J9Q99b5fHIrbhJ\nTZlZK9znpChHNInqYTqM7VlRk+M6swjMpTEGIPiUw8ZAvRezcFDAu41gjfGJtFWO\nopWayZVaPSzzwo8zy39Mj0w179oFykLESs/1RNBB0ZgFfRA7U49UXoifAoGAMnuH\nMsHx9Xy3sg+9+7hi4MVbzReCNqHYYiBD5ebsRc9TU628gCV\nE6/g41/vu0/pZuOm/1hIg3eMaY+1WEc9Qprb8Bja2uBlrlmoM2FHv/MEK2d56dTP\ntE5k39GHDt1Rcu8tQx2OAYygwbx1aWBbfr3+tuUCgYBGYaLo2W2ZjBroL+XouKhq\nGNOGwAfMvP2jvKJIgL1Xj0ju5BB/XtMfM1rQu26Vl+wdLSiZ3TLIQgDdunSoXqY6\niT5WOK2zIuIe2uqBSBmfEPK1PaedpIR1roFkaZZ4VEy1AR5+iuw5DnrTyNi7j25p\nv4V/ZKKhxcu1ns7M/SIdNA==\n-----END PRIVATE KEY-----\n"

export TG_BOT_TOKEN="1577224234:34645756fghd-345345346-dgh4645645"
```