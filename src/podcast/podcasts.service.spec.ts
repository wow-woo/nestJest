import { Episode } from './entities/episode.entity';
import { PodcastsService } from './podcasts.service';
import { Podcast } from './entities/podcast.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

const podcastRepositoryMockFn = ()=>({
  find: jest.fn(),
  findOne: jest.fn(),
  create:jest.fn(),
  save:jest.fn(),
  delete:jest.fn()
})

const EpisodeRepositoryMockFn = ()=>({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
})

type repo<entity> = Partial<Record<keyof Repository<entity> , jest.Mock>>

describe('PodcastsService', ()=>{
  let service:PodcastsService
  let podcastRepositoryMock:repo<Podcast>
  let EpisodeRepositoryMock:repo<Episode>
  beforeEach( async()=>{
    const test = await Test.createTestingModule({
      providers:[
        PodcastsService,
        {
          provide:getRepositoryToken(Podcast),
          useValue: podcastRepositoryMockFn()
        }, 
        {
          provide:getRepositoryToken(Episode),
          useValue:EpisodeRepositoryMockFn()
        }
      ]
    }).compile()

    service = test.get<PodcastsService>(PodcastsService)
    podcastRepositoryMock = test.get(getRepositoryToken(Podcast))
    EpisodeRepositoryMock = test.get(getRepositoryToken(Episode))
  })
  it('Should be podcastService defined', ()=>{
    expect(service).toBeDefined()
  })

  
  describe('getAllPodcasts', ()=>{
    const podcast = {
      title:'thi',
      category:'thi',
      rating:'thi',
      episodes:[]
    }

    it('Should retrieve all podcasts with NO episode successfully', async()=>{
      podcastRepositoryMock.find.mockResolvedValue([podcast])

      const result = await service.getAllPodcasts()
      
      expect(podcastRepositoryMock.find).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        ok: true,
        podcasts:expect.any(Array)
      })
    })

    it('Should retrieve all podcasts with episode in it successfully', async()=>{
      podcast.episodes.push({
        title:'jskl',
        category:'jskl',
        podcast
      })
      podcastRepositoryMock.find.mockResolvedValue([podcast])

      const result = await service.getAllPodcasts()
      
      expect(podcastRepositoryMock.find).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        ok: true,
        podcasts:expect.any(Array)
      })
    })

    it('Should fail on exception', async()=>{
      podcastRepositoryMock.find.mockRejectedValue(new Error('err'))

      const result = await service.getAllPodcasts()

      expect(podcastRepositoryMock.find).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        ok: false,
        error: 'Internal server error occurred.'
      })
    })

  })

  describe('createPodcast', ()=>{
    const createPodcastArgs ={
      title: 'sdsf',
      category: 'sdsf',
    }
    const podcast = {
      title:'thi',
      category:'thi',
      rating:'thi',
      episodes:[]
    }
    const PODCAST_ID= 1

    it('Should create new podcast', async()=>{
      podcastRepositoryMock.create.mockResolvedValue(podcast)
      podcastRepositoryMock.save.mockResolvedValue({id:PODCAST_ID})

      const result = await service.createPodcast(createPodcastArgs)
      expect(podcastRepositoryMock.create).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.create).toHaveBeenCalledWith(createPodcastArgs)
      expect(podcastRepositoryMock.save).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.save).toHaveBeenCalledWith(podcast)

      expect(result).toEqual({
        ok: true,
        id:PODCAST_ID,
      })
    })

    it('Should fail on exception', async()=>{
      podcastRepositoryMock.create.mockRejectedValue(new Error('err'))
      
      const result = await service.createPodcast(createPodcastArgs)

      expect(result).toEqual({
        ok: false,
        error:'Internal server error occurred.'
    })
    })

  })

  describe('getPodcast', ()=>{
    const getPodcastArgs= 1
    const findOneArgs = {
      id:{id:getPodcastArgs},
      rel:{ relations: ['episodes'] }
    }
    const podcast = {
      id:1
    }

    it('Should retrieve specific podcast successfully', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(podcast)

      const result = await service.getPodcast(getPodcastArgs)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual({
        ok: true,
        podcast:expect.any(Object),
      })
    })

    it('Should fail on NO podcast found', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(false)

      const result = await service.getPodcast(getPodcastArgs)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${getPodcastArgs} not found`,
      })
    })

    it('Should fail on exception', async()=>{
      podcastRepositoryMock.findOne.mockRejectedValue(new Error('err'))

      const result = await service.getPodcast(getPodcastArgs)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual({
        ok:false,
        error:"Internal server error occurred."
      })
    })
  })

  describe('deletePodcast', ()=>{
    const podcastId =1
    const findOneArgs = {
      id:{id:podcastId},
      rel:{ relations: ['episodes'] }
    }
    const podcast = {
      id:1
    }

    it('Should delete specific podcast successfully', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(podcast)
      // podcastRepositoryMock.delete.mockResolvedValue(true)

      const result = await service.deletePodcast(podcastId)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(podcastRepositoryMock.delete).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.delete).toHaveBeenCalledWith({id:podcastId} )
      expect(await service.getPodcast(podcastId)).toEqual({ok:true, podcast})
      expect(result).toEqual({
        ok: true,
      })
    })

    it('Should fail on NO podcast found or Error', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(false)

      const result = await service.deletePodcast(podcastId)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual(
        { ok:false, error:"Podcast with id 1 not found" }
      )
    })

    it('Should fail on Error', async()=>{
      podcastRepositoryMock.findOne.mockRejectedValue(new Error('err'))

      const result = await service.deletePodcast(podcastId)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual(
        { ok:false, error: "Internal server error occurred." }
      )
    })

    it('Should fail on exception', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(podcast)
      podcastRepositoryMock.delete.mockRejectedValue(new Error('err'))

      const result = await service.deletePodcast(podcastId)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(podcastRepositoryMock.delete).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.delete).toHaveBeenCalledWith({id:podcastId})
      expect(result).toEqual({
        ok:false,
        error:"Internal server error occurred."
      })
    })
  })

  describe('updatePodcast', ()=>{
    const updatePodcastArgs = {
      id:1,
      payload:{ title:"sdfjdsklf" , rating:2}
    }
    const findOneArgs = {
      id:{id:1},
      rel:{ relations: ['episodes'] }
    }

    const podcast = {
      id:1
    }

    it('Should update specific podcast successfully', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(podcast)

      const result = await service.updatePodcast(updatePodcastArgs)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(podcastRepositoryMock.save).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.save).toHaveBeenCalledWith({ ...podcast, ...updatePodcastArgs.payload })
      expect(await service.getPodcast(updatePodcastArgs.id)).toEqual({ok:true, podcast})
      expect(result).toEqual({
        ok: true,
      })
    })

    it('Should fail on getPodcast part', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(false)

      const result = await service.updatePodcast(updatePodcastArgs)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual(
        { ok:false, error:"Podcast with id 1 not found" }
      )
    })

    it('Should fail on Error', async()=>{
      podcastRepositoryMock.findOne.mockRejectedValue(new Error('err'))

      const result = await service.updatePodcast(updatePodcastArgs)
      
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(result).toEqual(
        { ok:false, error: "Internal server error occurred." }
      )
    })

    it('Should fail on Rating retrains', async()=>{
      podcastRepositoryMock.findOne.mockResolvedValue(podcast)
      // podcastRepositoryMock.delete.mockResolvedValue(true)
      updatePodcastArgs.payload.rating = 10;
      const result = await service.updatePodcast(updatePodcastArgs)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(await service.getPodcast(updatePodcastArgs.id)).toEqual({ok:true, podcast})
      expect(result).toEqual({
        ok: false,
        error: 'Rating must be between 1 and 5.',
      })
    })

    it('Should fail on exception', async()=>{
      podcastRepositoryMock.findOne.mockRejectedValue(new Error('err'))

      const result = await service.updatePodcast(updatePodcastArgs)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(podcastRepositoryMock.findOne).toHaveBeenCalledWith(findOneArgs.id, findOneArgs.rel)
      expect(await service.getPodcast(updatePodcastArgs.id)).toEqual({ok:false, error:"Internal server error occurred."})
      expect(result).toEqual({
        ok: false, error:"Internal server error occurred."
      })
    })
  })

  describe('getEpisodes', ()=>{
    const podcastId = 1
    
    const podcast:Podcast = {
      id:1,
      title:'sfdsf',
      category:'sds',
      rating:3,
      createdAt:new Date('11'),
      updatedAt:new Date('22'),
      episodes : []
    }

    it('Should retrieve all episodes successfully', async()=>{
        jest.spyOn(service, 'getPodcast').mockImplementation(async()=>(
          {ok:true, podcast}
        ))

        const result = await service.getEpisodes(podcastId)
        
        expect(service.getPodcast).toHaveBeenCalledTimes(1)
        expect(service.getPodcast).toHaveBeenCalledWith(podcastId)
        expect(result).toEqual({
          ok: true,
          episodes: podcast.episodes,
        })
    })
    it('Should fail on NO episode found', async()=>{
      jest.spyOn(service, 'getPodcast').mockImplementation(async()=>(
        {ok:false, error:'null err'}
      ))

      const result = await service.getEpisodes(podcastId)
      
      expect(service.getPodcast).toHaveBeenCalledTimes(1)
      expect(service.getPodcast).toHaveBeenCalledWith(podcastId)
      expect(result).toEqual(
        { ok:false, error:'null err' }
      )
    })

    it('Should fail on exception', async()=>{
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error('err'))

      const result = await service.getEpisodes(podcastId)
      
      expect(service.getPodcast).toHaveBeenCalledTimes(1)
      expect(service.getPodcast).toHaveBeenCalledWith(podcastId)
      expect(result).toEqual({
        ok: false,
        error: "Internal server error occurred.",
      })
    })
  })

  describe('getEpisode', ()=>{
    const getEpisodeArgs = {
      podcastId:1,
      episodeId:1, 
    }
    const podcast:Podcast = {
      id:1,
      title:'sfdsf',
      category:'sds',
      rating:3,
      createdAt:new Date('11'),
      updatedAt:new Date('22'),
      episodes : []
    }
    const episode  = {
      id:1,
      title:'sdf',
      category:'sdf',
      createdAt:new Date('sdf'),
      updatedAt:new Date('sdf'),
      podcast:podcast
    }
    const episodes = [episode]

    it('Should retrieve an episode successfully', async()=>{
      jest.spyOn(service, 'getEpisodes').mockImplementation(async()=>({
        ok:true, episodes,
      }))
      
      const result = await service.getEpisode(getEpisodeArgs)

      expect(service.getEpisodes).toHaveBeenCalledTimes(1)
      expect(service.getEpisodes).toHaveBeenCalledWith(getEpisodeArgs.podcastId)
      expect(result).toEqual({
        ok: true,
        episode,
      })
    })

    it('Should fail on NO episodes found', async()=>{
      jest.spyOn(service, 'getEpisodes').mockImplementation(async()=>({
        ok:false,
      }))
      
      const result = await service.getEpisode(getEpisodeArgs)

      expect(service.getEpisodes).toHaveBeenCalledTimes(1)
      expect(service.getEpisodes).toHaveBeenCalledWith(getEpisodeArgs.podcastId)
      expect(result).toEqual(
        { ok:false, error:undefined }
      )
    })

    it('Should fail on NO episode matched', async()=>{
      jest.spyOn(service, 'getEpisodes').mockImplementation(async()=>({
        ok:true, episodes,
      }))
      
      episodes[0].id=100
      const result = await service.getEpisode(getEpisodeArgs)

      expect(service.getEpisodes).toHaveBeenCalledTimes(1)
      expect(service.getEpisodes).toHaveBeenCalledWith(getEpisodeArgs.podcastId)
      expect(result).toEqual({
        ok: false,
        error: `Episode with id ${getEpisodeArgs.episodeId} not found in podcast with id ${getEpisodeArgs.podcastId}`,
      })
    })

    it('Should fail on exception', async()=>{
      jest.spyOn(service, 'getEpisodes').mockRejectedValue(new Error('err'))
      
      const result = await service.getEpisode(getEpisodeArgs)
      
      expect(service.getEpisodes).toHaveBeenCalledTimes(1)
      expect(service.getEpisodes).toHaveBeenCalledWith(getEpisodeArgs.podcastId)
      expect(result).toEqual({
        ok: false,
        error: "Internal server error occurred."
      })
    })

  })

  describe('createEpisode', ()=>{
    const createEpisodeArgs = {
      podcastId: 1,
      title: 'sfdsf',
      category: 'sfdsf',
    }
    const podcast:Podcast = {
      id:1,
      title:'sfdsf',
      category:'sds',
      rating:3,
      createdAt:new Date('11'),
      updatedAt:new Date('22'),
      episodes : []
    }
    const episode  = {
      id:1,
      title:'sdf',
      category:'sdf',
      podcast:podcast
    }

    it('Should create new episode successfully', async()=>{
      EpisodeRepositoryMock.create.mockResolvedValue(episode)
      episode.podcast = podcast
      EpisodeRepositoryMock.save.mockResolvedValue(episode)
      jest.spyOn(service, 'getPodcast').mockImplementation(async()=>({
        ok:true, podcast,
      }))
      
      const result = await service.createEpisode(createEpisodeArgs)
      
      expect(service.getPodcast).toHaveBeenCalledTimes(1)
      expect(service.getPodcast).toHaveBeenCalledWith(createEpisodeArgs.podcastId)
      expect(EpisodeRepositoryMock.create).toHaveBeenCalledTimes(1)
      expect(EpisodeRepositoryMock.create).toHaveBeenCalledWith({
        title:createEpisodeArgs.title,
        category:createEpisodeArgs.category
      })
      expect(EpisodeRepositoryMock.save).toHaveBeenCalledTimes(1)
      expect(EpisodeRepositoryMock.save).toHaveBeenCalledWith(episode)
      
      expect(result).toEqual({
        ok: true,
        id:1,
      })
    })

    it('Should fail on NO podcast found', async()=>{
      jest.spyOn(service, 'getPodcast').mockImplementation(async()=>({
        ok:false, error:'err',
      }))
      
      const result = await service.createEpisode(createEpisodeArgs)
      
      expect(service.getPodcast).toHaveBeenCalledTimes(1)
      expect(service.getPodcast).toHaveBeenCalledWith(createEpisodeArgs.podcastId)
      
      expect(result).toEqual(
        { ok:false, error:'err' }
      )
    })

    it('Should fail on exception', async()=>{
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error('err'))
      
      const result = await service.createEpisode(createEpisodeArgs)
      
      expect(service.getPodcast).toHaveBeenCalledTimes(1)
      expect(service.getPodcast).toHaveBeenCalledWith(createEpisodeArgs.podcastId)
      
      expect(result).toEqual({
        ok: false,
        error: "Internal server error occurred."
      })
    })

  })

  describe('deleteEpisode', ()=>{
    const deleteEpisodeArgs = {
      podcastId: 1,
      episodeId: 2,
    }
    const podcast:Podcast = {
      id:1,
      title:'sfdsf',
      category:'sds',
      rating:3,
      createdAt:new Date('11'),
      updatedAt:new Date('22'),
      episodes : []
    }
    const episode: Episode  = {
      id:1,
      title:'sdf',
      category:'sdf',
      createdAt:new Date('12'),
      updatedAt:new Date('12'),
      podcast
    }

    it('Should create delete an episode successfully', async()=>{
      EpisodeRepositoryMock.delete.mockResolvedValue(episode)
      jest.spyOn(service, 'getEpisode').mockImplementation(async()=>({
        ok:true, episode,
      }))
      
      const result = await service.deleteEpisode(deleteEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith(deleteEpisodeArgs)
      expect(EpisodeRepositoryMock.delete).toHaveBeenCalledTimes(1)
      expect(EpisodeRepositoryMock.delete).toHaveBeenCalledWith({id:episode.id})
      
      expect(result).toEqual(
        { ok: true }
      )
    })

    it('Should fail on No episode found', async()=>{
      jest.spyOn(service, 'getEpisode').mockImplementation(async()=>({
        ok:false, error:'err',
      }))
      
      const result = await service.deleteEpisode(deleteEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith(deleteEpisodeArgs)
      
      expect(result).toEqual(
        { ok:false, error:'err' }
      )
    })

    it('Should fail on exception', async()=>{
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error('err'))
      
      const result = await service.deleteEpisode(deleteEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith(deleteEpisodeArgs)
      
      expect(result).toEqual(
        { ok:false, error: "Internal server error occurred." }
      )
    })

  })

  describe('updateEpisode', ()=>{
    const updateEpisodeArgs = {
      podcastId: 1,
      episodeId: 2,
      rest:  { } 
    }
    const podcast:Podcast = {
      id:1,
      title:'sfdsf',
      category:'sds',
      rating:3,
      createdAt:new Date('11'),
      updatedAt:new Date('22'),
      episodes : []
    }
    const episode: Episode  = {
      id:1,
      title:'sdf',
      category:'sdf',
      podcast:podcast,
      createdAt:new Date('11'),
      updatedAt:new Date('11')
    }

    it('Should update episode successfully', async()=>{
      jest.spyOn(service, 'getEpisode').mockImplementation(async()=>({
        ok:true, episode,
      }))
      
      const result = await service.updateEpisode(updateEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId:updateEpisodeArgs.podcastId,
        episodeId : updateEpisodeArgs.episodeId
      })
      expect(EpisodeRepositoryMock.save).toHaveBeenCalledTimes(1)
      expect(EpisodeRepositoryMock.save).toHaveBeenCalledWith(expect.any(Object))
      
      expect(result).toEqual({ok: true})
    })

    it('Should fail on No episode found', async()=>{
      jest.spyOn(service, 'getEpisode').mockImplementation(async()=>({
        ok:false, error:'err',
      }))
      
      const result = await service.updateEpisode(updateEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId:updateEpisodeArgs.podcastId,
        episodeId : updateEpisodeArgs.episodeId
      })
      expect(result).toEqual(
        { ok : false, error :'err' }
      )
    })

    it('Should fail on exception', async()=>{
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error('err'))
      
      const result = await service.updateEpisode(updateEpisodeArgs)
      
      expect(service.getEpisode).toHaveBeenCalledTimes(1)
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId:updateEpisodeArgs.podcastId,
        episodeId : updateEpisodeArgs.episodeId
      })
      expect(result).toEqual(
        { ok : false, error : "Internal server error occurred." }
      )
    })

  })

})
