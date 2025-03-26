const getAuditLogsSchema = {
    querystring: {
      type: 'object',
      properties: {
        api_id: { type: 'string' },
        from_date: { type: 'string' },
        to_date: { type: 'string' },
        page_number: { type: 'integer' },
        page_size: { type: 'integer' },
        hash_code: { type: 'string' }
      },
      required: ['api_id', 'from_date', 'to_date', 'page_size', 'hash_code'],
      additionalProperties: false
    },
    response: {
      200: {
        type: 'object',
        properties: {
          response_code: { type: 'integer' },
          from_date: { type: 'string', format: 'date-time' },
          to_date: { type: 'string', format: 'date-time' },
          page_number: { type: 'integer' },
          page_size: { type: 'integer' },
          total_transactions: { type: 'integer' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                bet_id: { type: 'string' },
                player_id: { type: 'string' },
                channel_type: { type: 'string' },
                outlet_id: { type: 'string' },
                kiosk_terminal_id: { type: 'string' },
                total_bet_amount: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' }, // Money format
                total_payout_amount: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' }, // Money format
                bet_date_time: { type: 'string', format: 'date-time' },
                settlement_date_time: { type: 'string', format: 'date-time' },
                platform_code: { type: 'string' },
                bet_status: { type: 'string', pattern: '^[DX]$' }, // Char pattern
                casino_bet_details: {
                  type: 'object',
                  properties: {
                    game_name: { type: 'string' },
                    game_id: { type: 'string' },
                    game_brand: { type: 'string' },
                    live_game_round: { type: 'string' },
                    table_room_id: { type: 'string' },
                    jackpot_contribution: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    jackpot_type: { type: 'string' },
                    jackpot_payout: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    seed_money: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    seed_money_over: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    seed_contribution: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    house_rake: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    rake_ceiling: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    blinds: { type: 'string' },
                    net_win: { type: 'string', pattern: '^[0-9]+(\\.[0-9]{1,2})?$' },
                    game_type: { type: 'string' }
                  },
                  additionalProperties: false
                },
                sports_bet_dtls: {
                  type: 'object',
                  properties: {
                    sports_name: { type: 'string' },
                    sports_game_type: { type: 'string' },
                    league_name: { type: 'string' },
                    event_name: { type: 'string' },
                    event_details: { type: 'string' },
                    bet_type: { type: 'string' }
                  },
                  additionalProperties: false
                }
              },
              additionalProperties: false
            }
          }
        },
      }
    }
  };

  export default {
    getAuditLogsSchema,
  };
  