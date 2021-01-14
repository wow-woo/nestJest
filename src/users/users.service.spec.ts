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
  sign: jest.fn(),
  verify: jest.fn()
}

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('User Service Test', () => {

  let service: UsersService
  let userRepository: MockRepository<User>

  beforeAll(async () => {
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

  })
})

it.todo('login')
it.todo('findById')
it.todo('editProfile')