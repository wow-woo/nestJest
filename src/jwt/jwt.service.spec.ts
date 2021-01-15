import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtService } from './jwt.service';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken'

const TOKEN = "this is a token"
const PRIVATE_KEY = 'this is a privateKey'
const USER_ID = 1

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({ id: USER_ID })),
  }
});


describe('JwtService', () => {
  let service:JwtService

  beforeEach( async()=>{
    const test = await Test.createTestingModule({
      providers:[
        JwtService,
        {
          provide:CONFIG_OPTIONS,
          useValue:{ privateKey : PRIVATE_KEY}
        }
      ],
  }).compile()

    service = test.get<JwtService>(JwtService)
  })

  it('Should be defined', ()=>{
    expect(service).toBeDefined()
  })

  it('Should sign jwt token', async()=>{
    const signArgs = {
      userId:USER_ID,
      privateKey: PRIVATE_KEY
    }
    const result = await service.sign(signArgs.userId);
    expect(jwt.sign).toHaveBeenCalledTimes(1)
    expect(jwt.sign).toHaveBeenCalledWith({id:signArgs.userId}, signArgs.privateKey)
    expect(result).toStrictEqual(expect.any(String))
  })

  it('Should verify jwt token', async()=>{
    const verifyArgs = {
      token:TOKEN,
      privateKey: PRIVATE_KEY
    }
    const result = await service.verify(verifyArgs.token);
    expect(jwt.verify).toHaveBeenCalledTimes(1)
    expect(jwt.verify).toHaveBeenCalledWith(verifyArgs.token, verifyArgs.privateKey)
    expect(result).toEqual({id:USER_ID})
  })

});
