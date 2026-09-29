FROM php:8.2-apache

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# NodeJS and NPM, libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    git zip unzip curl ca-certificates build-essential \
    nodejs npm \
    && docker-php-ext-install pdo_mysql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Apache
RUN a2enmod rewrite

COPY ./apache/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
