import schema from "../schema/chatSupport";
import controllers from "../controller/chatSupport";

function chatSupportRoutes(fastify) {
    fastify.get("/get-all-conversation", {
      schema: schema.getAllConversations,
      handler: controllers.getAllConversations,
    });
  
    fastify.post("/create-conversation-status-update", {
      schema: schema.createConversationUpdate,
      handler: controllers.createConversationUpdate,
    });
    fastify.post("/create-conversation", {
      schema: schema.createConversation,
      handler: controllers.createConversation,
    });
    fastify.post("/login", {
      schema: schema.loginSchema,
      handler: controllers.login,
    });
    fastify.get("/games", {
      schema: schema.getGames,
      handler: controllers.getGames,
    });
    fastify.get("/get-playerID-by-uuid", {
      schema: schema.getPlayerIdByUUID,
      handler: controllers.getPlayerIdByUUID,
    });
    fastify.get("/get-messages-by-convoId", {
      schema: schema.getMessagesByConvoId,
      handler: controllers.getMessagesByConvoId,
    });
    fastify.get("/get-representative-transaction", {
      schema: schema.getRepresentativeTransaction,
      handler: controllers.getRepresentativeTransaction,
    });
    fastify.get("/get-concerns", {
      schema: schema.getConcerns,
      handler: controllers.getConcerns,
    });
    fastify.get("/get-winning-balls-with-probabilities", {
      schema: schema.getWinningBallsWithProbabilities,
      handler: controllers.getWinningBallsWithProbabilities,
    });
    fastify.get("/get-hosts", {
      schema: schema.getHosts,
      handler: controllers.getHosts,
    });
    fastify.get("/get-convo", {
      schema: schema.getConvo,
      handler: controllers.getConvo,
    });
    fastify.get("/get-host-ranking", {
      schema: schema.getHostRanking,
      handler: controllers.getHostRanking,
    });
    fastify.get("/get-daily-player-ranking", {
      schema: schema.getDailyPlayerRanking,
      handler: controllers.getDailyPlayerRanking,
    });
    fastify.get("/get-top-givers-ranking", {
      schema: schema.getTopGiversRanking,
      handler: controllers.getTopGiversRanking,
    });
    fastify.get("/get-overall-top-givers-ranking", {
      schema: schema.getOverallTopGiversRanking,
      handler: controllers.getOverallTopGiversRanking,
    });
    fastify.post("/update-conversation-concern", {
      schema: schema.updateConversationConcern,
      handler: controllers.updateConversationConcern,
    });
    fastify.post("/update-conversation-status", {
      schema: schema.updateConversationStatus,
      handler: controllers.updateConversationStatus,
    });
    fastify.post("/update-message-read", {
      schema: schema.updateMessageRead,
      handler: controllers.updateMessageRead,
    });
    
    fastify.get("/check-convo-has-concern", {
      schema: schema.checkConvoHasConcern,
      handler: controllers.checkConvoHasConcern,
    });

    fastify.get("/get-player-balance", {
      schema: schema.getPlayerBalance,
      handler: controllers.getPlayerBalance,
    });
    fastify.get("/get-user-by-id", {
      schema: schema.getUserById,
      handler: controllers.getUserById,
    });
    fastify.get("/get-top-winner-amount", {
      schema: schema.getTopWinnerAmount,
      handler: controllers.getTopWinnerAmount,
    });
    fastify.post("/send-gift", {
      schema: schema.sendGift,
      handler: controllers.sendGift,
    });
    fastify.post("/like-host", {
      schema: schema.likeHost,
      handler: controllers.likeHost,
    });
    fastify.post("/rate-chat", {
      schema: schema.rateChat,
      handler: controllers.rateChat,
    });

    fastify.get("/check-liked-host", {
      schema: schema.checkLikedHost,
      handler: controllers.checkLikedHost,
    });

    fastify.get("/count-likes", {
      schema: schema.countLikes,
      handler: controllers.countLikes,
    });

    fastify.get("/get-total-player-bets-for-last-month", {
      schema: schema.getTotalPlayerBetsForLastMonth,
      handler: controllers.getTotalPlayerBetsForLastMonth,
    });

    fastify.get("/check-user-has-active-badge", {
      schema: schema.checkIfUserHasActiveBadge,
      handler: controllers.checkIfUserHasActiveBadge,
    });

    fastify.get("/get-transaction-count-last-week", {
      schema: schema.getTransactionCountForLastWeek,
      handler: controllers.getTransactionCountForLastWeek,
    });

    fastify.get("/check-user-login-last-week", {
      schema: schema.checkUserLoginLastWeek,
      handler: controllers.checkUserLoginLastWeek,
    });

    fastify.get("/get-top-gifters", {
      schema: schema.getTopGifters,
      handler: controllers.getTopGifters,
    });

    fastify.post("/create-player-badge", {
      schema: schema.createPlayerBadge,
      handler: controllers.createPlayerBadge,
    });
    fastify.get("/get-representative-player-transactions", {
      schema: schema.getRepresentativePlayerTransactions,
      handler: controllers.getRepresentativePlayerTransactions,
    });
    fastify.post("/claim-representative-player-transactions", {
      schema: schema.claimRepresentativePlayerTransactions,
      handler: controllers.claimRepresentativePlayerTransactions,
    });
    
    // fastify.get("/get-badge-by-user-id", {
    //   schema: schema.getBadgeByUserId,
    //   handler: controllers.getBadgeByUserId,
    // });
  }
  
  export default chatSupportRoutes;
  
