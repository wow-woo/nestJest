import { User } from './entities/user.entity';
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneOrFail: jest.fn(),
})

const mockJwtService = {
  sign: jest.fn(()=>'tokennnn'),
  verify: jest.fn()
}

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('User Service Test', () => {

  let service: UsersService
  let userRepository: MockRepository<User>
  let jwtService:JwtService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository()
        },
        { provide: JwtService, useValue: mockJwtService }
      ]
    }).compile()

    service = module.get<UsersService>(UsersService)
    userRepository = module.get(getRepositoryToken(User))
    jwtService = module.get<JwtService>(JwtService)
  })
  it('Should be defined', () => {
    expect(service).toBeDefined();
  })

  describe('Create Account', () => {
    enum UserRole {
      Host = 'Host',
      Listener = 'Listener',
    }
    const createArgs = {
      email: 'eamil',
      password: '1234',
      role: UserRole.Host,
    }

    it("Should fail, if user exists", async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'shsshakslkj'
      })
      enum UserRole {
        Host = 'Host',
        Listener = 'Listener',
      }
      const result = await service.createAccount(createArgs)

      expect(result).toEqual(
        { ok: false, error: `There is a user with that email already` }
      )
    })

    it('Should create and save a user', async () => {
      userRepository.findOne.mockResolvedValue(false)
      userRepository.create.mockResolvedValue({ id: 1 })
      const result = await service.createAccount(createArgs)

      // expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(userRepository.create).toHaveBeenCalledTimes(1)
      expect(userRepository.create).toHaveBeenCalledWith(createArgs)
      expect(await userRepository.create({ id: 1 })).toEqual({ id: 1 })

      expect(userRepository.save).toHaveBeenCalledTimes(1)

      expect(result).toEqual({
        ok: true,
        error: null,
      })
    })

    it('Should fail on exception', async()=>{
      userRepository.findOne.mockRejectedValue(new Error('rrrrject'))
      const result = await service.createAccount(createArgs)

      expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        ok: false,
        error: 'Could not create account'
      })
    })
  })

  describe('Login', ()=>{
    const loginArgs= {
      email: 'sfdsf', 
      password: 'sfdsf'
    }
    it("Should fail since no user found", async()=>{
      userRepository.findOne.mockResolvedValue(false)

      const result = await service.login(loginArgs)

      expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
      expect(result).toEqual({ ok: false, error: 'User not found' })
    })

    it('Should fail, if password is wrong', async()=>{
      const userMock = {
        checkPassword:jest.fn(()=>Promise.resolve(false))
      } 
      userRepository.findOne.mockResolvedValue(userMock)
      
      const result = await service.login(loginArgs)
      
      expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
      expect(userMock.checkPassword).toHaveBeenCalledTimes(1)
      expect(userMock.checkPassword).toHaveBeenCalledWith(expect.any(String))
      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      })
    })

    it('Should login with a token', async()=>{
      const userMock = {
        id:1,
        checkPassword:jest.fn(()=>Promise.resolve(true))
      } 
      userRepository.findOne.mockResolvedValue(userMock)
      const result = await service.login(loginArgs)
      
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1)
      expect(mockJwtService.sign).toHaveBeenCalledWith(expect.any(Number))
      expect(result).toEqual({
        ok: true,
        token:'tokennnn',
      })
    })

    it('Should fail on exception', async()=>{
      userRepository.findOne.mockRejectedValue(new Error('this is error'))
      
      const result = await service.login(loginArgs)
      
      expect(result).toEqual({
        ok: false,
        error:Error("this is error"),
      })
    })
  })

  describe('FindById', ()=>{
    const id = 1

    it('Should fail to find user by id', async()=>{
      userRepository.findOneOrFail.mockRejectedValue(new Error('no user, eh!'))

      const result = await service.findById(id)

      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1)
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith({id})
      expect(result).toEqual({
        ok: false,
        error: 'User Not Found',
      })
    })

    it('Should find User by id successfully', async()=>{
      const user = {
        id:1,
        mora:'mora'
      }
      userRepository.findOneOrFail.mockResolvedValue(user)

      const result = await service.findById(id)

      expect(result).toEqual({
        ok: true,
        user,
      })
    })
  })

  describe('Edit profile', ()=>{
    const userId = 1
    const editProfileArgs = {
        email : 'sdfjdskflj', 
        password : 'sdfjdskflj'
    }
    const userMock = {
      email: 'sdfsdfds',
      password: 'sdfsdfds',
    }

    it('Should edit your profile with email and password successfully', async()=>{
      userRepository.findOne.mockResolvedValue(userMock)
      const result = await service.editProfile(userId, editProfileArgs)

      expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(userMock.email).toBe(editProfileArgs.email)
      expect(userMock.password).toBe(editProfileArgs.password)
      expect(userRepository.save).toHaveBeenCalledTimes(1)
      expect(userRepository.save).toHaveBeenCalledWith(userMock)
      expect(result).toEqual({
        ok: true,
      })

    })

    it('Should edit your profile without email and password successfully', async()=>{
      userRepository.findOne.mockResolvedValue(userMock)
      const result = await service.editProfile(userId, {})

      expect(userRepository.findOne).toHaveBeenCalledTimes(1)
      expect(userMock.email).toBe(userMock.email)
      expect(userMock.password).toBe(userMock.password)
      expect(userRepository.save).toHaveBeenCalledTimes(1)
      expect(userRepository.save).toHaveBeenCalledWith(userMock)
      expect(result).toEqual({
        ok: true,
      })

    })

    it('Should fail on exception', async()=>{
      userRepository.findOne.mockRejectedValue(new Error('error haha'))

      const result = await service.editProfile(userId, editProfileArgs)

      expect(result).toEqual({
        ok: false,
        error: 'Could not update profile',
      })
    })
  })
})
