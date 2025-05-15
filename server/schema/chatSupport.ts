const getAllConversations = {
    response: {
      200: {
        type: "object",
        properties: {
          isActive: {type: "integer" },
          uuid: { type: "string", format: "uuid" },
          id: { type: "integer" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string" },
          message: {
            type: "string",
            default: "All active users fetched successfully!",
          },
        },
      },
    },
  };

  const createConversation = {
    body: {
      type: 'object',
      required: ['player_id', 'csr_id'],
      properties: {
        player_id: { type: 'integer' },
        csr_id: { type: 'integer' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
        },
      },
    },
  };

  const rateChat = {
    body: {
      type: 'object',
      required: ['player_id', 'csr_id', 'conversation_id', 'rate'],
      properties: {
        player_id: { type: 'integer' },
        csr_id: { type: 'integer' },
        conversation_id: { type: 'integer' },
        rate: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
        },
      },
    },
  };
  

const createConversationUpdate = {
  body: {
    type: 'object',
    required: ['conversation_id', 'status', 'updated_by'],
    properties: {
      conversation_id: { type: 'integer' },
      status: { type: 'string' },
      updated_by: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        update_id: { type: 'integer' },
      },
    },
  },
}

const getPlayerIdByUUID = {
  response: {
    200: {
      type: "object",
      properties: {
        id: {type: "integer" },
        message: {
          type: "string",
          default: "Player ID fetched successfully!",
        },
      },
    },
  },
};

const getGameHistory = {
  response: {
    200: {
      type: "object",
      properties: {
        gameHistory: {type: "object" },
        message: {
          type: "string",
          default: "Player ID fetched successfully!",
        },
      },
    },
  },
};

const loginSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        token: { type: "string" }, // The JWT token
        message: { 
          type: "string",
          default: "Login successful!", // Default success message
        },
      },
    },
    400: {
      type: "object",
      properties: {
        message: { 
          type: "string", 
          default: "Invalid mobile number" // Default error message for invalid mobile number
        },
      },
    },
  },
};

const getConvo = {
  response: {
    200: {
      type: "object",
      properties: {
        conversation: {type: "object" },
        message: {
          type: "string",
          default: "Player ID fetched successfully!",
        },
      },
    },
  },
};

const getMessagesByConvoId = {
  response: {
    200: {
      type: "object",
      properties: {
        message_id: {type: "integer" },
        conversation_id: {type: "integer" },
        sender_id: {type: "integer" },
        message_text: {type: "string" },
        createdAt: {type: "string" },
        sender_nickName: {type: "integer" },
        player_nickName: {type: "string" },
        csr_nickName: {type: "string" },
        sender_role: {type: "string" },
        message: {
          type: "string",
          default: "Messages fetched successfully!",
        },
      },
    },
  },
};

const getRepresentativeTransaction = {
  response: {
    200: {
      type: "object",
      properties: {
        game_name: {type: "string" },
        ticket_number: {type: "string" },
        total_number_of_bets: {type: "integer" },
        total_amount: {type: "integer" },
        payment_amount: {type: "integer" },
        change_amount: {type: "integer" },
        player_bets: {type: "array" },
        message: {
          type: "string",
          default: "Representative transactions fetched successfully!",
        },
      },
    },
  },
};

const getPlayerBalance = {
  response: {
    200: {
      type: "object",
      properties: {
        player_balance: {type: "integer" },
        message: {
          type: "string",
          default: "player balance fetched successfully!",
        },
      },
    },
  },
};

const getTopWinnerAmount = {
  response: {
    200: {
      type: "object",
      properties: {
        topWinnerAmount: {type: "integer" },
        message: {
          type: "string",
          default: "player balance fetched successfully!",
        },
      },
    },
  },
};

const getUserById = {
  response: {
    200: {
      type: "object",
      properties: {
        user: {type: "object" },
        message: {
          type: "string",
          default: "player balance fetched successfully!",
        },
      },
    },
  },
};

const getConcerns = {
  response: {
    200: {
      type: "object",
      properties: {
        id: {type: "integer" },
        concern_type: {type: "string" },
        message: {
          type: "string",
          default: "Concern fetched successfully!",
        },
      },
    },
  },
};

const getWinningBallsWithProbabilities = {
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "Winning balls and probabilities fetched successfully!",
        },
        data: {
          type: "object",
          properties: {
            dosBalls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  gamesId: { type: "integer" },
                  ball: { type: "string" },
                  game: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
            dosBallProbability: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ball: { type: "string" },
                  percentage: { type: "number" },
                },
              },
            },
            zodiacBalls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  gamesId: { type: "integer" },
                  ball: { type: "string" },
                  game: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
            zodiacBallProbability: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ball: { type: "string" },
                  percentage: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  },
};


const getHosts = {
  response: {
    200: {
      type: "object",
      properties: {
        host: {type: "object" },
        message: {
          type: "string",
          default: "hosts fetched successfully!",
        },
      },
    },
  },
};

const getHostRanking = {
  response: {
    200: {
      type: "object",
      properties: {
        hostRanking: {type: "object" },
        message: {
          type: "string",
          default: "host ranking fetched successfully!",
        },
      },
    },
  },
};

const getDailyPlayerRanking = {
  response: {
    200: {
      type: "object",
      properties: {
        dailyPlayerRanking: {type: "object" },
        message: {
          type: "string",
          default: "daily player ranking fetched successfully!",
        },
      },
    },
  },
};

const getTopGiversRanking = {
  response: {
    200: {
      type: "object",
      properties: {
        topGivers: {type: "object" },
        message: {
          type: "string",
          default: "top givers fetched successfully!",
        },
      },
    },
  },
};
const getOverallTopGiversRanking = {
  response: {
    200: {
      type: "object",
      properties: {
        topGivers: {type: "object" },
        message: {
          type: "string",
          default: "top givers fetched successfully!",
        },
      },
    },
  },
};

const updateConversationConcern = {
  body: {
    type: 'object',
    required: ['id', 'concern_id'],
    properties: {
      id: { type: 'integer' },
      concern_id: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'Conversation concern updated successfully!',
        },
      },
    },
  },
};

const checkConvoHasConcern = {
  querystring: {
    type: 'object',
    required: ['convoId'],
    properties: {
      convoId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        hasConcern: { type: 'boolean' },
        message: {
          type: 'string',
          default: 'Conversation concern fetched successfully!',
        },
      },
    },
  },
};

const checkLikedHost = {
  querystring: {
    type: 'object',
    required: ['hostId', 'likerId'],
    properties: {
      hostId: { type: 'integer' },
      likerId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        liked: { type: 'boolean' },
        message: {
          type: 'string',
          default: 'Conversation concern fetched successfully!',
        },
      },
    },
  },
};

const countLikes = {
  querystring: {
    type: 'object',
    required: ['hostId'],
    properties: {
      hostId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        count: { type: 'integer' },
        message: {
          type: 'string',
          default: 'Count Successfully!',
        },
      },
    },
  },
};

const updateConversationStatus = {
  body: {
    type: 'object',
    required: ['id', 'status'],
    properties: {
      id: { type: 'integer' },
      status: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'Conversation status updated successfully!',
        },
      },
    },
  },
};

const updateMessageRead = {
  body: {
    type: 'object',
    required: ['conversation_id'],
    properties: {
      conversation_id: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'message read updated successfully!',
        },
      },
    },
  },
};

const sendGift = {
  body: {
    type: 'object',
    required: ['hostId', 'senderId', 'amount'],
    properties: {
      hostId: { type: 'integer' },
      senderId: { type: 'integer' },
      amount: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'Successfully sent gift!',
        },
      },
    },
  },
};

const likeHost = {
  body: {
    type: 'object',
    required: ['hostId', 'likerId'],
    properties: {
      hostId: { type: 'integer' },
      likerId: { type: 'integer' }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'Successfully liked host!',
        },
      },
    },
  },
};

const checkIfUserHasActiveBadge = {
  querystring: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: ['integer', 'boolean'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        activeBadge: { type: 'boolean' },
        message: {
          type: 'string',
          default: 'activeBadge concern fetched successfully!',
        },
      },
    },
  },
};

const getTotalPlayerBetsForLastMonth = {
  querystring: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        totalAmount: { type: 'integer' },
        message: {
          type: 'string',
          default: 'totalAmount Successfully!',
        },
      },
    },
  },
};

const getTransactionCountForLastWeek = {
  querystring: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        transactionCount: { type: 'integer' },
        message: {
          type: 'string',
          default: 'transactionCount Successfully!',
        },
      },
    },
  },
};

const getTransactionStatistics = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      sort: { type: "string", pattern: "^[a-zA-Z_]+,(asc|desc)$" },
      filter: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The transaction statistics is successfuly fetch!",
        },
      },
    },
  },
};

// const getBadgeByUserId = {
//   querystring: {
//     type: 'object',
//     required: ['userId'],
//     properties: {
//       userId: { type: 'integer' },
//     },
//   },
//   response: {
//     200: {
//       type: 'object',
//       properties: {
//         activePlayerBadge: { 
//           oneOf: [
//             { type: 'object' },   // when the badge is found, it returns an object
//             { type: 'boolean' }   // when no badge is found, it returns a boolean
//           ],
//         },
//         message: {
//           type: 'string',
//           default: 'transactionCount Successfully!',
//         },
//       },
//     },
//   },
// };

const createPlayerBadge = {
  body: {
    type: 'object',
    required: ['badgeId', 'userId', 'expirationDate'],
    properties: {
      badgeId: { type: 'integer' },
      userId: { type: 'integer' },
      expirationDate: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'object' },
      },
    },
  },
};

const checkUserLoginLastWeek = {
  querystring: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        loggedInWholeWeekLastWeek: { type: 'boolean' },
        message: {
          type: 'string',
          default: 'loggedInWholeWeekLastWeek concern fetched successfully!',
        },
      },
    },
  },
};

const getTopGifters = {
  response: {
    200: {
      type: "object",
      properties: {
        topGifters: {type: "object" },
        message: {
          type: "string",
          default: "topGifters fetched successfully!",
        },
      },
    },
  },
};

const getGames = {
  response: {
    200: {
      type: "object",
      properties: {
        content: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              label: { type: "string" },
              isActive: { type: "boolean" },
              isStreaming: { type: "boolean" },
              moderatorRoute: { type: "string" },
              gameRoute: { type: "string" },
              updatedAt: { type: "string", format: "date-time" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
        totalCount: { type: "number" },
        message: {
          type: "string",
          default: "Get All Games is successfully fetched!",
        },
      },
    },
    // You can add more status code responses like 500 for error handling if needed
  },
};


const getRepresentativePlayerTransactions = {
  response: {
    200: {
      type: "object",
      properties: {
        unclaimedWinnings: { 
          type: "array",
          items: { 
            type: "object",
            // Define the structure of each transaction object in unclaimedWinnings
            properties: {
              // Define properties for each transaction in unclaimedWinnings
              transactionId: { type: "string" },
              winningAmount: { type: "number" },
              status: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
        claimedWinnings: { 
          type: "array",
          items: { 
            type: "object",
            // Define the structure of each transaction object in claimedWinnings
            properties: {
              // Define properties for each transaction in claimedWinnings
              transactionId: { type: "string" },
              winningAmount: { type: "number" },
              status: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
        loseBettings: { 
          type: "array",
          items: { 
            type: "object",
            // Define the structure of each transaction object in loseBettings
            properties: {
              // Define properties for each transaction in loseBettings
              transactionId: { type: "string" },
              bettingAmount: { type: "number" },
              status: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
        unclaimedWinningsCount: { 
          type: "integer",
          description: "The total count of unclaimed winnings transactions",
        },
        claimedWinningsCount: { 
          type: "integer",
          description: "The total count of claimed winnings transactions",
        },
        loseBettingsCount: { 
          type: "integer",
          description: "The total count of lose betting transactions",
        },
        dailyClaimedWinnings: { 
          type: "number",
          description: "Total claimed winnings for today",
        },
        overallClaimedWinnings: { 
          type: "number",
          description: "Total claimed winnings overall",
        },
      },
    },
  },
};

const claimRepresentativePlayerTransactions = {
  body: {
    type: "object",
    properties: {
      representativePlayerTransactions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer", description: "ID of the representative player transaction" },
            amount: { type: "number", description: "Amount to be claimed from the transaction" },
          },
          required: ["id", "amount"],
        },
        description: "Array of representative player transactions to claim",
      },
      user_id: { 
        type: "integer", 
        description: "User ID of the player making the claim" 
      },
    },
    required: ["representativePlayerTransactions", "user_id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "Representative player transactions claimed successfully!",
        },
      },
    },
    400: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Error message when the provided parameters are incorrect or a transaction fails",
        },
      },
    },
  },
};



  
  
  export default {
    getAllConversations,
    createConversation,
    createConversationUpdate,
    getPlayerIdByUUID,
    getMessagesByConvoId,
    getConcerns,
    updateConversationConcern,
    updateConversationStatus,
    checkConvoHasConcern,
    getPlayerBalance,
    getUserById,
    getTopWinnerAmount,
    getHosts,
    sendGift,
    getHostRanking,
    getTopGiversRanking,
    getDailyPlayerRanking,
    likeHost,
    checkLikedHost,
    countLikes,
    rateChat,
    updateMessageRead,
    getConvo,
    checkIfUserHasActiveBadge,
    getTotalPlayerBetsForLastMonth,
    getTransactionCountForLastWeek,
    checkUserLoginLastWeek,
    getTopGifters,
    //getBadgeByUserId,
    createPlayerBadge,
    getRepresentativeTransaction,
    getTransactionStatistics,
    getWinningBallsWithProbabilities,
    getRepresentativePlayerTransactions,
    claimRepresentativePlayerTransactions,
    getOverallTopGiversRanking,
    loginSchema,
    getGames,
    getGameHistory
  };