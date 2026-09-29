FROM php:8.2-apache

# Встановлення розширень PHP для роботи з MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Увімкнення mod_rewrite
RUN a2enmod rewrite

# Встановлення робочої директорії
WORKDIR /var/www/html

# Налаштування прав доступу
RUN chown -R www-data:www-data /var/www/html
