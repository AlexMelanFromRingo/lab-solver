# Образ для індивідуального завдання: PHP з Apache, Composer та Node.
#
# Відносно Dockerfile з методичних вказівок виправлено дві речі.
#
# Перша – шлях до конфігурації веб-сервера. В архіві Laravel_inst.zip файл
# apache.conf лежить поруч із Dockerfile, а команда COPY шукає його в
# підкаталозі ./apache. Складання образу через це завершувалося помилкою
# «./apache/apache.conf: not found». Тут файл справді покладено в каталог
# apache, і шлях у COPY відповідає дійсності.
#
# Друга – версія Node. У репозиторії Debian bookworm лежить Node 18, а
# збірник Vite у свіжому Laravel вимагає щонайменше 20. Тому Node ставиться
# з репозиторію NodeSource.
FROM php:8.2-apache

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Node.js 20 та бібліотеки
RUN apt-get update && apt-get install -y --no-install-recommends \
        git zip unzip curl ca-certificates build-essential gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && docker-php-ext-install pdo_mysql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Apache
RUN a2enmod rewrite

COPY ./apache/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
