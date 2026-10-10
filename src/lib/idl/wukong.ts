/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wukong.json`.
 */
export type Wukong = {
  "address": "5BWF3ueP3ccwFMRv23nn1p1yFUA8hRsqrXy8cQye5zKk",
  "metadata": {
    "name": "wukong",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Wukong: competitive work marketplace — USDC escrow, AI-judged submissions, on-chain reputation"
  },
  "instructions": [
    {
      "name": "cancelTask",
      "docs": [
        "Pull the task before anyone has submitted; full refund."
      ],
      "discriminator": [
        69,
        228,
        134,
        187,
        134,
        105,
        238,
        48
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true,
          "relations": [
            "task"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "creatorToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "claimStake",
      "docs": [
        "Settle one entry's stake after the task settles: refunded if it scored",
        "at or above the spam bar, slashed to the treasury otherwise.",
        "Permissionless; the last one closes the vault."
      ],
      "discriminator": [
        62,
        145,
        133,
        242,
        244,
        59,
        53,
        139
      ],
      "accounts": [
        {
          "name": "cranker",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          },
          "relations": [
            "submission"
          ]
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "submission.worker",
                "account": "submission"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "workerToken",
          "writable": true
        },
        {
          "name": "treasuryToken",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "closeSubmissions",
      "docs": [
        "Stop accepting work and hand the task to the judge.",
        "Creator or judge can close early; anyone can close after the deadline."
      ],
      "discriminator": [
        253,
        222,
        230,
        146,
        81,
        77,
        0,
        45
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "createTask",
      "docs": [
        "Post a task and lock the full reward in escrow."
      ],
      "discriminator": [
        194,
        80,
        6,
        180,
        232,
        127,
        48,
        171
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "creatorToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createTaskArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "judge",
          "type": "pubkey"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "feeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "scoreSubmission",
      "docs": [
        "Judge publishes a final, public score. The podium updates on-chain."
      ],
      "discriminator": [
        133,
        77,
        147,
        204,
        107,
        246,
        14,
        194
      ],
      "accounts": [
        {
          "name": "judge",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          },
          "relations": [
            "submission"
          ]
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "submission.worker",
                "account": "submission"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "submission.worker",
                "account": "submission"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "score",
          "type": "u16"
        },
        {
          "name": "reportHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "settle",
      "docs": [
        "Release escrow to the podium. Permissionless: the outcome is fully",
        "determined by the scores already on-chain.",
        "remaining_accounts: for each podium place paid, in order:",
        "[submission (mut), worker token account (mut), worker reputation (mut)]"
      ],
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "cranker",
          "docs": [
            "Anyone may crank `settle`; `settle_pick` requires the creator."
          ],
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "treasuryToken",
          "writable": true
        },
        {
          "name": "creatorToken",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "settlePick",
      "docs": [
        "Creator-picks mode: the AI shortlists the podium, the creator chooses."
      ],
      "discriminator": [
        95,
        36,
        227,
        93,
        229,
        135,
        96,
        147
      ],
      "accounts": [
        {
          "name": "cranker",
          "docs": [
            "Anyone may crank `settle`; `settle_pick` requires the creator."
          ],
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "treasuryToken",
          "writable": true
        },
        {
          "name": "creatorToken",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "pick",
          "type": "u8"
        }
      ]
    },
    {
      "name": "submitWork",
      "docs": [
        "Enter the arena: commit to a piece of work by its hash."
      ],
      "discriminator": [
        158,
        80,
        101,
        51,
        114,
        130,
        101,
        253
      ],
      "accounts": [
        {
          "name": "worker",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "task.creator",
                "account": "task"
              },
              {
                "kind": "account",
                "path": "task.nonce",
                "account": "task"
              }
            ]
          }
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "worker"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "worker"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "Stake accounts: required only when the task has an entry stake."
          ],
          "optional": true
        },
        {
          "name": "vault",
          "writable": true,
          "optional": true
        },
        {
          "name": "workerToken",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "optional": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "judge",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "treasury",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "feeBps",
          "type": {
            "option": "u16"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "reputation",
      "discriminator": [
        55,
        148,
        90,
        71,
        68,
        183,
        193,
        28
      ]
    },
    {
      "name": "submission",
      "discriminator": [
        58,
        194,
        159,
        158,
        75,
        102,
        178,
        197
      ]
    },
    {
      "name": "task",
      "discriminator": [
        79,
        34,
        229,
        55,
        88,
        90,
        55,
        84
      ]
    }
  ],
  "events": [
    {
      "name": "stakeSettled",
      "discriminator": [
        171,
        53,
        105,
        171,
        142,
        65,
        236,
        232
      ]
    },
    {
      "name": "submissionScored",
      "discriminator": [
        80,
        131,
        159,
        235,
        58,
        66,
        53,
        223
      ]
    },
    {
      "name": "submissionsClosed",
      "discriminator": [
        255,
        104,
        125,
        67,
        25,
        180,
        186,
        208
      ]
    },
    {
      "name": "taskCancelled",
      "discriminator": [
        158,
        101,
        220,
        187,
        16,
        141,
        141,
        64
      ]
    },
    {
      "name": "taskCreated",
      "discriminator": [
        49,
        174,
        6,
        7,
        71,
        159,
        69,
        175
      ]
    },
    {
      "name": "taskSettled",
      "discriminator": [
        161,
        220,
        91,
        215,
        23,
        253,
        247,
        65
      ]
    },
    {
      "name": "workSubmitted",
      "discriminator": [
        136,
        185,
        210,
        174,
        216,
        140,
        64,
        125
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "feeTooHigh",
      "msg": "Platform fee is above the 20% cap"
    },
    {
      "code": 6001,
      "name": "invalidTitle",
      "msg": "Title must be 1-64 bytes"
    },
    {
      "code": 6002,
      "name": "invalidReward",
      "msg": "Reward must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidDeadline",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6004,
      "name": "invalidMaxSubmissions",
      "msg": "max_submissions must be between 1 and 256"
    },
    {
      "code": 6005,
      "name": "wrongMint",
      "msg": "Task mint does not match the protocol settlement mint"
    },
    {
      "code": 6006,
      "name": "taskNotOpen",
      "msg": "Task is not open for submissions"
    },
    {
      "code": 6007,
      "name": "deadlinePassed",
      "msg": "Submission deadline has passed"
    },
    {
      "code": 6008,
      "name": "taskFull",
      "msg": "Task has reached its submission cap"
    },
    {
      "code": 6009,
      "name": "creatorCannotSubmit",
      "msg": "Task creators cannot compete on their own task"
    },
    {
      "code": 6010,
      "name": "ratingTooLow",
      "msg": "Reputation rating too low for this task"
    },
    {
      "code": 6011,
      "name": "notAllowedToClose",
      "msg": "Only the creator or judge can close submissions before the deadline"
    },
    {
      "code": 6012,
      "name": "noSubmissions",
      "msg": "Task has no submissions; cancel it instead"
    },
    {
      "code": 6013,
      "name": "taskNotJudging",
      "msg": "Task is not in the judging phase"
    },
    {
      "code": 6014,
      "name": "notJudge",
      "msg": "Signer is not the protocol judge"
    },
    {
      "code": 6015,
      "name": "invalidScore",
      "msg": "Score must be between 0 and 10000"
    },
    {
      "code": 6016,
      "name": "alreadyScored",
      "msg": "Submission was already scored; scores are final"
    },
    {
      "code": 6017,
      "name": "scoringIncomplete",
      "msg": "Not every submission has been scored yet"
    },
    {
      "code": 6018,
      "name": "wrongJudgeMode",
      "msg": "This task's judge mode does not allow that settlement path"
    },
    {
      "code": 6019,
      "name": "invalidPick",
      "msg": "Pick is not on the AI shortlist"
    },
    {
      "code": 6020,
      "name": "notCreator",
      "msg": "Only the task creator can pick the winner"
    },
    {
      "code": 6021,
      "name": "podiumAccountMismatch",
      "msg": "Remaining accounts do not match the podium"
    },
    {
      "code": 6022,
      "name": "cannotCancel",
      "msg": "Only tasks with zero submissions can be cancelled"
    },
    {
      "code": 6023,
      "name": "stakeTooHigh",
      "msg": "Entry stake cannot exceed the reward"
    },
    {
      "code": 6024,
      "name": "pickGraceTooLong",
      "msg": "Pick grace period is capped at 7 days"
    },
    {
      "code": 6025,
      "name": "missingStakeAccounts",
      "msg": "This task requires a stake: pass the mint, vault, your token account and the token program"
    },
    {
      "code": 6026,
      "name": "stakeAccountMismatch",
      "msg": "Stake account does not match the task"
    },
    {
      "code": 6027,
      "name": "nothingToClaim",
      "msg": "This submission has no stake left to settle"
    },
    {
      "code": 6028,
      "name": "taskNotSettled",
      "msg": "Task is not settled yet"
    },
    {
      "code": 6029,
      "name": "pickWindowOpen",
      "msg": "The creator's pick window is still open"
    },
    {
      "code": 6030,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "config",
      "docs": [
        "Global protocol configuration. One per deployment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Can rotate the judge, treasury and fee."
            ],
            "type": "pubkey"
          },
          {
            "name": "judge",
            "docs": [
              "Off-chain AI judge oracle. The only key allowed to publish scores."
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Wallet that receives the platform fee (its token account for `mint`)."
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "The settlement asset every task is paid in (USDC)."
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "docs": [
              "Platform fee, in basis points of the reward."
            ],
            "type": "u16"
          },
          {
            "name": "taskCount",
            "docs": [
              "Lifetime counters, handy for dashboards."
            ],
            "type": "u64"
          },
          {
            "name": "totalEscrowed",
            "type": "u64"
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "createTaskArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "category",
            "type": "u8"
          },
          {
            "name": "briefHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "payoutMode",
            "type": {
              "defined": {
                "name": "payoutMode"
              }
            }
          },
          {
            "name": "judgeMode",
            "type": {
              "defined": {
                "name": "judgeMode"
              }
            }
          },
          {
            "name": "minRating",
            "type": "u32"
          },
          {
            "name": "maxSubmissions",
            "type": "u16"
          },
          {
            "name": "entryStake",
            "type": "u64"
          },
          {
            "name": "pickGraceSecs",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "judgeMode",
      "docs": [
        "Who makes the final call."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "aiFinal"
          },
          {
            "name": "creatorPicks"
          }
        ]
      }
    },
    {
      "name": "payoutMode",
      "docs": [
        "How the reward pool is split across the podium."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "winnerTakesAll"
          },
          {
            "name": "topThree"
          }
        ]
      }
    },
    {
      "name": "podiumEntry",
      "docs": [
        "One slot of the live podium, maintained on-chain as scores land."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "submission",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u16"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "filled",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "reputation",
      "docs": [
        "Portable, on-chain worker reputation. Survives any front-end."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "submissions",
            "type": "u32"
          },
          {
            "name": "scored",
            "type": "u32"
          },
          {
            "name": "scoreSum",
            "type": "u64"
          },
          {
            "name": "bestScore",
            "type": "u16"
          },
          {
            "name": "wins",
            "type": "u32"
          },
          {
            "name": "podiums",
            "type": "u32"
          },
          {
            "name": "totalEarned",
            "type": "u64"
          },
          {
            "name": "rating",
            "type": "u32"
          },
          {
            "name": "lastActive",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stakeSettled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "submission",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "refunded",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "submission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "contentHash",
            "docs": [
              "sha256 of the submitted work; content lives off-chain and is verified against this."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "submittedAt",
            "type": "i64"
          },
          {
            "name": "score",
            "docs": [
              "0..=10_000 (two implied decimals), published by the judge."
            ],
            "type": "u16"
          },
          {
            "name": "scored",
            "type": "bool"
          },
          {
            "name": "reportHash",
            "docs": [
              "sha256 of the judge's full written report for this submission."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rank",
            "docs": [
              "0 = not placed, 1..=3 = podium place after settlement."
            ],
            "type": "u8"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "stakeSettled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "submissionScored",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "submission",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u16"
          },
          {
            "name": "reportHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "submissionsClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "submissionCount",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "task",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "category",
            "type": "u8"
          },
          {
            "name": "briefHash",
            "docs": [
              "sha256 of the full brief stored off-chain; the judge verifies it before scoring."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "feeBps",
            "docs": [
              "Fee snapshot at creation, so later config changes can't touch live escrow."
            ],
            "type": "u16"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "taskStatus"
              }
            }
          },
          {
            "name": "payoutMode",
            "type": {
              "defined": {
                "name": "payoutMode"
              }
            }
          },
          {
            "name": "judgeMode",
            "type": {
              "defined": {
                "name": "judgeMode"
              }
            }
          },
          {
            "name": "minRating",
            "docs": [
              "Minimum on-chain reputation rating required to submit."
            ],
            "type": "u32"
          },
          {
            "name": "maxSubmissions",
            "type": "u16"
          },
          {
            "name": "entryStake",
            "docs": [
              "Refundable stake each entrant locks (0 = none). Slashed to the treasury",
              "if the entry scores under the spam bar; refunded otherwise."
            ],
            "type": "u64"
          },
          {
            "name": "stakesOutstanding",
            "docs": [
              "Staked entries whose stake has not been refunded or slashed yet."
            ],
            "type": "u16"
          },
          {
            "name": "pickGraceSecs",
            "docs": [
              "Creator-picks mode: after this long past closing, anyone can settle on",
              "the AI's top pick. Protects workers from a buyer who never decides."
            ],
            "type": "u32"
          },
          {
            "name": "closedAt",
            "type": "i64"
          },
          {
            "name": "submissionCount",
            "type": "u16"
          },
          {
            "name": "scoredCount",
            "type": "u16"
          },
          {
            "name": "podium",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "podiumEntry"
                  }
                },
                3
              ]
            }
          },
          {
            "name": "paidOut",
            "type": "u64"
          },
          {
            "name": "feePaid",
            "type": "u64"
          },
          {
            "name": "settledAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "taskCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "refunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "taskCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "title",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "taskSettled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "winners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "amounts",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "refunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "taskStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "judging"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "workSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "submission",
            "type": "pubkey"
          },
          {
            "name": "worker",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "contentHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    }
  ]
};
