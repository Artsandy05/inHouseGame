const generateRoles = () => {
  const roles = [
    "superadmin", // 1
    "moderator", // 2
    "supervisor", // 3
    "verifier", // 4
    "superagent", // 5
    "masteragent", // 6
    "agent", // 7
    "player", // 8
    "player", // 9
    "player", // 10
    "moderator", // 11
    "player", // 12
    "player", // 13
    "superadmin", // 14
    "moderator", // 15
    "supervisor", // 16
    "verifier", // 17
    "superagent", // 18
    "masteragent", // 19
    "agent", // 20
    "player", // 21
    "auditor", // 22
    "player", // 23
    "player", // 24
    "superadmin", // 25
    "moderator", // 26
    "supervisor", // 27
    "verifier", // 28
    "superagent", // 29
    "masteragent", // 30
    "agent", // 31
    "player", // 32
    "player", // 33
    "player", // 34
    "player", // 35
    "csr", // 36
    "player", // 37
    "player", // 38
    "player", // 39
    "player", // 40
    "csr", // 41
    "player", // 42
    "player", // 43
    "player", // 44
    "csr", // 45
    "player", // 46
    "player", // 47
    "player", // 48
    "auditor", // 49
    "player", // 50
  ];
     
    return roles;
  };


  const generateRoleForHostProfile = () => {
     const roles = [
      "host", // 1
       "host", // 2
       "host", // 3
       "host", // 4
       "host", // 5
       "host", // 6
       "host", // 7
       "host", // 8
       "host", // 9
       "host", // 10
       "host", // 11
       "host", // 12
       "host", // 13
       "host", // 14
       "host", // 15
       "host", // 16
       "host", // 17
       "host", // 18
       "host", // 19
     ];

      return roles;
  };

  module.exports = {
    generateRoles,
    generateRoleForHostProfile
  };