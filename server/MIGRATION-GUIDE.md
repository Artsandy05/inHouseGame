# Migration and Seed Guide

## Create DB name = `local-karera`

## Execute the script in `local-karera` SQL
```
set global net_buffer_length=1000000;
set global max_allowed_packet=1000000000;
set global wait_timeout = 1000;
set global interactive_timeout = 1000;
```
> then seed the tables

## Seed Tables in source code

1.  `cd server/`
2.  `npm run seed:all` or `yarn seed:all`
3.  `npm run seed:development` or `yarn seed:development`

## run the server
`npm run serve` or `yarn serve`